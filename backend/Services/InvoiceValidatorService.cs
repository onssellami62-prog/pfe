using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Xml;
using backend.Models;

namespace backend.Services
{
    public class InvoiceValidatorService
    {
        private const int MAX_SCORE = 100;
        
        public ValidationResult ValidateInvoice(Invoice invoice)
        {
            var result = new ValidationResult
            {
                ConformityScore = MAX_SCORE,
                CategoryScores = new Dictionary<string, int>
                {
                    { "DonneesClient", 20 },
                    { "Montants", 25 },
                    { "TVA", 20 },
                    { "Dates", 15 },
                    { "Lignes", 20 }
                }
            };

            // Validation par catégorie
            ValidateClientData(invoice, result);
            ValidateAmounts(invoice, result);
            ValidateTVA(invoice, result);
            ValidateDates(invoice, result);
            ValidateLines(invoice, result);

            // Calcul du score final
            CalculateFinalScore(result);
            
            // Déterminer le niveau de conformité
            DetermineConformityLevel(result);
            
            // Calculer la probabilité de rejet
            CalculateRejectionProbability(result);

            return result;
        }

        private void ValidateClientData(Invoice invoice, ValidationResult result)
        {
            int categoryScore = 20;
            
            // Validation Matricule Fiscal
            if (string.IsNullOrEmpty(invoice.ClientMatricule))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_MF_001",
                    Field = "ClientMatricule",
                    Message = "Le matricule fiscal du client est obligatoire",
                    Severity = "Critique",
                    SuggestedSolution = "Saisissez le matricule fiscal du client (13 caractères)",
                    Points = 10
                });
                categoryScore -= 10;
            }
            else if (invoice.ClientMatricule.Length != 13)
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_MF_002",
                    Field = "ClientMatricule",
                    Message = "Le matricule fiscal doit contenir exactement 13 caractères",
                    Severity = "Critique",
                    SuggestedSolution = $"Corrigez le MF '{invoice.ClientMatricule}' pour qu'il ait 13 caractères",
                    Points = 10
                });
                categoryScore -= 10;
            }
            else if (!Regex.IsMatch(invoice.ClientMatricule, @"^\d{7}[A-Z]{3}\d{3}$"))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_MF_003",
                    Field = "ClientMatricule",
                    Message = "Format de matricule fiscal invalide",
                    Severity = "Critique",
                    SuggestedSolution = "Format attendu : 7 chiffres + 3 lettres + 3 chiffres (ex: 1234567ABC123)",
                    Points = 8
                });
                categoryScore -= 8;
            }

            // Validation Nom Client
            if (string.IsNullOrWhiteSpace(invoice.ClientName))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_CLIENT_001",
                    Field = "ClientName",
                    Message = "Le nom du client est obligatoire",
                    Severity = "Critique",
                    SuggestedSolution = "Saisissez le nom complet du client",
                    Points = 5
                });
                categoryScore -= 5;
            }

            // Validation Adresse Client
            if (string.IsNullOrWhiteSpace(invoice.ClientAddress))
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_CLIENT_002",
                    Field = "ClientAddress",
                    Message = "L'adresse du client est manquante",
                    Severity = "Mineure",
                    SuggestedSolution = "Ajoutez l'adresse complète du client",
                    Points = 2
                });
                categoryScore -= 2;
            }

            result.CategoryScores["DonneesClient"] = Math.Max(0, categoryScore);
        }

        private void ValidateAmounts(Invoice invoice, ValidationResult result)
        {
            int categoryScore = 25;
            decimal tolerance = 0.01m;

            // Validation cohérence TTC
            decimal expectedTTC = invoice.TotalHT + invoice.TotalTVA + invoice.StampDuty;
            if (Math.Abs(expectedTTC - invoice.TotalTTC) > tolerance)
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_CALC_001",
                    Field = "TotalTTC",
                    Message = $"Incohérence de calcul TTC. Attendu: {expectedTTC:F3} DT, Reçu: {invoice.TotalTTC:F3} DT",
                    Severity = "Critique",
                    SuggestedSolution = "Recalculez les totaux : TTC = HT + TVA + Timbre",
                    Points = 15
                });
                categoryScore -= 15;
            }

            // Validation Droit de Timbre
            if (invoice.TotalHT >= 1000m && invoice.StampDuty == 0)
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_TIM_001",
                    Field = "StampDuty",
                    Message = "Droit de timbre manquant pour une facture supérieure à 1000 DT",
                    Severity = "Critique",
                    SuggestedSolution = "Ajoutez le droit de timbre de 1.000 DT",
                    Points = 10
                });
                categoryScore -= 10;
            }

            // Validation montants négatifs
            if (invoice.TotalHT < 0 || invoice.TotalTVA < 0 || invoice.TotalTTC < 0)
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_CALC_002",
                    Field = "Montants",
                    Message = "Les montants ne peuvent pas être négatifs",
                    Severity = "Critique",
                    SuggestedSolution = "Vérifiez que tous les montants sont positifs",
                    Points = 10
                });
                categoryScore -= 10;
            }

            result.CategoryScores["Montants"] = Math.Max(0, categoryScore);
        }

        private void ValidateTVA(Invoice invoice, ValidationResult result)
        {
            int categoryScore = 20;
            decimal tolerance = 0.01m;
            int[] allowedTvaRates = { 0, 7, 13, 19 };

            foreach (var line in invoice.Lines)
            {
                // Validation taux TVA autorisé
                if (!allowedTvaRates.Contains(line.TvaRate))
                {
                    result.Errors.Add(new ValidationError
                    {
                        Code = "ERR_TVA_001",
                        Field = $"Ligne {line.Id}",
                        Message = $"Taux TVA {line.TvaRate}% non autorisé en Tunisie",
                        Severity = "Critique",
                        SuggestedSolution = "Utilisez un taux autorisé : 0%, 7%, 13% ou 19%",
                        Points = 8
                    });
                    categoryScore -= 8;
                }

                // Validation calcul TVA
                decimal expectedTVA = Math.Round(line.TotalHT * (line.TvaRate / 100m), 3);
                if (Math.Abs(expectedTVA - line.TotalTVA) > tolerance)
                {
                    result.Errors.Add(new ValidationError
                    {
                        Code = "ERR_TVA_002",
                        Field = $"Ligne {line.Id}",
                        Message = $"TVA mal calculée. Attendu: {expectedTVA:F3} DT, Reçu: {line.TotalTVA:F3} DT",
                        Severity = "Majeure",
                        SuggestedSolution = $"Recalculez : {line.TotalHT:F3} × {line.TvaRate}% = {expectedTVA:F3} DT",
                        Points = 5
                    });
                    categoryScore -= 5;
                }
            }

            result.CategoryScores["TVA"] = Math.Max(0, categoryScore);
        }

        private void ValidateDates(Invoice invoice, ValidationResult result)
        {
            int categoryScore = 15;
            DateTime now = DateTime.UtcNow;

            // Validation date future
            if (invoice.Date > now)
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_DATE_001",
                    Field = "Date",
                    Message = "La date de facture ne peut pas être dans le futur",
                    Severity = "Critique",
                    SuggestedSolution = $"Utilisez une date antérieure ou égale à aujourd'hui ({now:dd/MM/yyyy})",
                    Points = 10
                });
                categoryScore -= 10;
            }

            // Validation date d'échéance
            if (invoice.DueDate.HasValue && invoice.DueDate <= invoice.Date)
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_DATE_002",
                    Field = "DueDate",
                    Message = "La date d'échéance doit être postérieure à la date de facture",
                    Severity = "Majeure",
                    SuggestedSolution = "Ajustez la date d'échéance pour qu'elle soit après la date de facture",
                    Points = 5
                });
                categoryScore -= 5;
            }

            // Validation période
            if (invoice.PeriodFrom.HasValue && invoice.PeriodTo.HasValue)
            {
                if (invoice.PeriodFrom > invoice.PeriodTo)
                {
                    result.Errors.Add(new ValidationError
                    {
                        Code = "ERR_DATE_003",
                        Field = "PeriodFrom/PeriodTo",
                        Message = "La période 'Du' doit être antérieure à la période 'Au'",
                        Severity = "Majeure",
                        SuggestedSolution = "Inversez les dates de période",
                        Points = 3
                    });
                    categoryScore -= 3;
                }
            }

            result.CategoryScores["Dates"] = Math.Max(0, categoryScore);
        }

        private void ValidateLines(Invoice invoice, ValidationResult result)
        {
            int categoryScore = 20;

            // Validation présence de lignes
            if (!invoice.Lines.Any())
            {
                result.Errors.Add(new ValidationError
                {
                    Code = "ERR_LINE_001",
                    Field = "Lines",
                    Message = "La facture doit contenir au moins une ligne",
                    Severity = "Critique",
                    SuggestedSolution = "Ajoutez au moins un produit ou service à la facture",
                    Points = 20
                });
                categoryScore = 0;
            }
            else
            {
                foreach (var line in invoice.Lines)
                {
                    // Validation description
                    if (string.IsNullOrWhiteSpace(line.Description))
                    {
                        result.Errors.Add(new ValidationError
                        {
                            Code = "ERR_LINE_002",
                            Field = $"Ligne {line.Id}",
                            Message = "Description de ligne vide",
                            Severity = "Majeure",
                            SuggestedSolution = "Ajoutez une description pour cette ligne",
                            Points = 3
                        });
                        categoryScore -= 3;
                    }

                    // Validation quantité
                    if (line.Qty <= 0)
                    {
                        result.Errors.Add(new ValidationError
                        {
                            Code = "ERR_LINE_003",
                            Field = $"Ligne {line.Id}",
                            Message = "La quantité doit être supérieure à zéro",
                            Severity = "Majeure",
                            SuggestedSolution = "Saisissez une quantité positive",
                            Points = 4
                        });
                        categoryScore -= 4;
                    }

                    // Validation prix unitaire
                    if (line.UnitPriceHT < 0)
                    {
                        result.Errors.Add(new ValidationError
                        {
                            Code = "ERR_LINE_004",
                            Field = $"Ligne {line.Id}",
                            Message = "Le prix unitaire ne peut pas être négatif",
                            Severity = "Majeure",
                            SuggestedSolution = "Saisissez un prix positif",
                            Points = 4
                        });
                        categoryScore -= 4;
                    }
                }
            }

            result.CategoryScores["Lignes"] = Math.Max(0, categoryScore);
        }

        private void CalculateFinalScore(ValidationResult result)
        {
            int totalScore = result.CategoryScores.Values.Sum();
            result.ConformityScore = Math.Max(0, Math.Min(100, totalScore));
            result.IsValid = result.ConformityScore >= 80 && result.CriticalErrors == 0;
        }

        private void DetermineConformityLevel(ValidationResult result)
        {
            if (result.ConformityScore >= 90)
                result.ConformityLevel = "Excellent";
            else if (result.ConformityScore >= 75)
                result.ConformityLevel = "Bon";
            else if (result.ConformityScore >= 60)
                result.ConformityLevel = "Moyen";
            else if (result.ConformityScore >= 40)
                result.ConformityLevel = "Faible";
            else
                result.ConformityLevel = "Très Faible";
        }

        private void CalculateRejectionProbability(ValidationResult result)
        {
            // Formule améliorée : probabilité basée sur le score et les erreurs
            decimal baseProb = (100 - result.ConformityScore) / 100m;
            
            // Augmenter légèrement la probabilité si erreurs critiques (max +20% par erreur)
            if (result.CriticalErrors > 0)
                baseProb += 0.15m * Math.Min(result.CriticalErrors, 2); // Max 2 erreurs comptées
            
            // Augmenter légèrement si erreurs majeures (max +10% par erreur)
            if (result.MajorErrors > 0)
                baseProb += 0.05m * Math.Min(result.MajorErrors, 2); // Max 2 erreurs comptées

            // Limiter à 95% maximum (jamais 100% de certitude de rejet)
            result.RejectionProbability = Math.Min(0.95m, baseProb);
        }
    }
}
