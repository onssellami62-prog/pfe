
/**
 * Conversion d'un nombre en lettres (Simplifié pour le Tunisien DT)
 */
export const amountToWords = (amount) => {
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

    const convertLessThanThousand = (n) => {
        if (n === 0) return '';
        let res = '';
        if (n >= 100) {
            res += (n >= 200 ? units[Math.floor(n / 100)] + ' ' : '') + 'cent ';
            n %= 100;
        }
        if (n >= 20) {
            res += tens[Math.floor(n / 10)] + (n % 10 === 1 ? ' et ' : ' ');
            n %= 10;
        } else if (n >= 10) {
            res += teens[n - 10] + ' ';
            return res;
        }
        res += units[n] + ' ';
        return res;
    };

    const num = Math.floor(amount);
    const millimes = Math.round((amount - num) * 1000);

    let result = '';
    if (num >= 1000) {
        result += convertLessThanThousand(Math.floor(num / 1000)) + 'mille ';
        result += convertLessThanThousand(num % 1000);
    } else {
        result += convertLessThanThousand(num);
    }

    result += 'Dinars ';
    if (millimes > 0) {
        result += 'et ' + convertLessThanThousand(millimes) + 'Millimes';
    }

    return result.trim().toUpperCase();
};

export const formatMatriculeDisplay = (mf) => {
    if (!mf) return '--- --- ---';
    const clean = mf.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length === 13) {
        return `${clean.substring(0, 7)} / ${clean.substring(7, 8)} / ${clean.substring(8, 9)} / ${clean.substring(9, 10)} / ${clean.substring(10)}`;
    }
    return mf;
};

export const validateMatriculeFiscal = (mf) => {
    const regex = /^\d{7}[A-Z]{3}\d{3}$/; // Standard simplifié
    return regex.test(mf.replace(/[^A-Z0-9]/g, '').toUpperCase());
};
