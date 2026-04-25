/**
 * Convertit un nombre en lettres (Français) spécifique pour le Dinar Tunisien.
 * Supporte jusqu'à 3 décimales (millimes).
 */

const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

function convertGroup(n) {
    let result = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) {
        if (h === 1) result += 'cent ';
        else result += units[h] + ' cent' + (t === 0 && u === 0 ? 's ' : ' ');
    }

    if (t === 1) {
        result += teens[u] + ' ';
    } else if (t > 1) {
        if (t === 7 || t === 9) {
            result += tens[t - 1] + (u === 1 ? ' et ' : '-') + teens[u] + ' ';
        } else {
            result += tens[t] + (u === 1 ? ' et ' : (u > 0 ? '-' : '')) + (u > 0 ? units[u] : '') + ' ';
        }
    } else if (u > 0) {
        result += units[u] + ' ';
    }

    return result.trim();
}

/**
 * @param {number} amount
 * @returns {string}
 */
export function amountToWords(amount) {
    if (amount === 0) return "zéro dinar";
    
    const dinars = Math.floor(amount);
    const millimes = Math.round((amount - dinars) * 1000);

    let result = "Arrêtée la présente facture à la somme de ";

    // Dinars part
    if (dinars === 0) {
        result += "zéro dinar";
    } else {
        const millions = Math.floor(dinars / 1000000);
        const thousands = Math.floor((dinars % 1000000) / 1000);
        const remainder = dinars % 1000;

        if (millions > 0) {
            result += convertGroup(millions) + (millions > 1 ? " millions " : " million ");
        }
        if (thousands > 0) {
            if (thousands === 1) result += "mille ";
            else result += convertGroup(thousands) + " mille ";
        }
        if (remainder > 0 || dinars === 0) {
            result += convertGroup(remainder);
        }
        result += (dinars > 1 ? " dinars" : " dinar");
    }

    // Millimes part
    if (millimes > 0) {
        result += " et " + convertGroup(millimes) + (millimes > 1 ? " millimes" : " millime");
    }

    return result + ".";
}
