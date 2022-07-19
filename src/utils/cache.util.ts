export enum CacheKeys {
    Chats = 'chess-game.chats',
    Anns = 'chess-game.announcements',
    Users = 'chess-game.users',
    Countries = 'chess-game.countries',
    TotalPlayers = 'chess-game.total-payers',
    GameMembers = 'chess-game.total-members'
}

export const computeKey = (env: string | undefined, key: string): string => {
    return env === 'production' ? key + '.prod' : key;
}