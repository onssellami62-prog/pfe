/**
 * Validation du Matricule Fiscal Tunisien — Format El Fatoora
 * Format : 1234567ABM000  (13 caractères, SANS séparateurs "/")
 *   - 7 chiffres
 *   - 1 lettre (catégorie)
 *   - 1 lettre (type activité)
 *   - 1 lettre (sous-type)
 *   - 3 chiffres (numéro d'ordre)
 *
 * Exemples valides :
 *   1234567AAM000
 *   9876543BPN001
 *   0000000APM000
 */

export const MF_REGEX = /^\d{7}[A-Z]{3}\d{3}$/i;

export const MF_FORMAT_DISPLAY = '1234567ABM000';
export const MF_FORMAT_HINT = '7 chiffres + 3 lettres + 3 chiffres (13 caractères)';
export const MF_LENGTH = 13;

/**
 * Valide le format d'un matricule fiscal tunisien (sans séparateurs)
 * @param {string} value
 * @returns {boolean}
 */
export function validateMatriculeFiscal(value) {
  if (!value || typeof value !== 'string') return false;
  return MF_REGEX.test(value.trim());
}

/**
 * Retourne le message d'erreur ou null si valide
 * @param {string} value
 * @returns {string|null}
 */
export function getMatriculeError(value) {
  if (!value || value.trim() === '') return 'Le matricule fiscal est obligatoire.';
  if (value.trim().length !== MF_LENGTH)
    return `Le matricule fiscal doit contenir exactement ${MF_LENGTH} caractères. Format : ${MF_FORMAT_DISPLAY}`;
  if (!validateMatriculeFiscal(value))
    return `Format invalide. Attendu : ${MF_FORMAT_DISPLAY} (${MF_FORMAT_HINT})`;
  return null;
}

/**
 * Normalise le matricule fiscal (majuscules, trim, retire les "/" si présents)
 * @param {string} value
 * @returns {string}
 */
export function normalizeMatricule(value) {
  return (value || '').trim().toUpperCase().replace(/\//g, '');
}

/**
 * CSS classes pour le champ matricule fiscal selon l'état
 */
export function getMatriculeInputClass(value, baseClass = '') {
  if (!value) return baseClass;
  if (validateMatriculeFiscal(value)) return `${baseClass} mf-valid`;
  return `${baseClass} mf-invalid`;
}
