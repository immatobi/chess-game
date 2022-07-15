export const generate = (size: number, isAlpha: boolean): string | number => {

    const pool = isAlpha ? 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789abcdefghijklmnpqrstuvwxyz' : '0123456789';
    const rand = []; let i = -1;

    while (++i < size) rand.push(pool.charAt(Math.floor(Math.random() * pool.length)));

    return rand.join('');
 
}