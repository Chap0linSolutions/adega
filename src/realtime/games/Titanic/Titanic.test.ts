import Store from '../../store';
import { Server } from 'socket.io';
import { Titanic } from './Titanic';

const daphne = {
    nickname: 'Daphne',
    avatarSeed: 'AABB',
    shipPlacement: undefined,
    hits: 0,
}

describe('Titanic Class', () => {
    const io = new Server();
    const testID = '1234';

    beforeAll(() => {
        Store.getInstance();
        const activeRooms = Store.getInstance().rooms;
        const newRoomCode = 'ABCD';
        activeRooms.set(newRoomCode, {
            ...Store.emptyRoom(),
            players: [
                {
                    playerID: 1234,
                    roomCode: 'ABCD',
                    currentlyPlaying: false,
                    nickname: 'Fred',
                    avatarSeed: 'ZXCV',
                    beers: 0,
                    socketID: testID,
                    currentTurn: false,
                },
            ],
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        const ABCD = Store.getInstance().rooms.get('ABCD');
        if (!ABCD) return;
        ABCD.currentGame = null;
    });

    describe('Constructor', () => {
        it('should return gameType as "round"', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            expect(titanicInstance.gameType).toEqual('round');
        });

        it('should return gameName as Titanic', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            expect(titanicInstance.gameName).toEqual('Titanic');
        });

        it('should initiate playerGameData as empty array', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            expect(titanicInstance.playerGameData.length).toEqual(0);
        });
    });

    describe('handleMessage method', () => {
        it('should call beginGame when moving from cover to game', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            const mockBeginGame = jest.spyOn(titanicInstance, 'beginGame');

            titanicInstance.handleMessage(testID, 'move-to', '/Titanic');
            expect(mockBeginGame).toBeCalled();
        });

        it('should call checkForGameConclusion when receiving player selections', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            const checkConclusionSpy = jest.spyOn(titanicInstance, 'checkForGameConclusion');
            titanicInstance.handleMessage(testID, 'move-to', '/Titanic');

            titanicInstance.handleMessage(testID, 'player-has-selected', JSON.stringify([400, 500, 0]));
            expect(checkConclusionSpy).toBeCalled();
        });
    });

    describe('beginGame method', () => {
        it('should fill playerGameData', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            expect(titanicInstance.playerGameData.length).toEqual(0);

            titanicInstance.handleMessage(testID, 'move-to', '/Titanic');
            expect(titanicInstance.playerGameData.length).toBeGreaterThan(0);
        });
    });

    describe('checkForGameConclusion method', () => {
        it('should call finishGame if all players placed their pieces', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            const finishSpy = jest.spyOn(titanicInstance, 'finishGame')
            titanicInstance.handleMessage(testID, 'move-to', '/Titanic');
            titanicInstance.playerGameData[0].shipPlacement = [100, 200, 300];

            titanicInstance.checkForGameConclusion();
            expect(finishSpy).toBeCalled();
        });

        it('should call finishGame if only current turn player is left', () => {
            const titanicInstance = new Titanic(io, 'ABCD');
            const finishGameSpy = jest.spyOn(titanicInstance, 'finishGame');
            const logSpy = jest.spyOn(titanicInstance, 'log');
            titanicInstance.handleMessage(testID, 'move-to', '/Titanic');
            titanicInstance.playerGameData.push(daphne)
            titanicInstance.playerGameData[0].shipPlacement = [-1];

            titanicInstance.checkForGameConclusion();
            expect(finishGameSpy).toBeCalled();
            expect(logSpy).toBeCalledWith('Só sobrou o jogador da vez.');
        });
    });

    describe('handleDisconnect method', () => {
        it('should change ship placement of player to disconnected and check conclusion', () => {
            //'disconnect' Fred
            const room = Store.getInstance().rooms.get('ABCD');
            if (!room) return;
            room.disconnectedPlayers.push(room.players[0]);

            const titanicInstance = new Titanic(io, 'ABCD');
            titanicInstance.handleMessage(testID, 'move-to', '/Titanic');
            const checkConclusionSpy = jest.spyOn(titanicInstance, 'checkForGameConclusion');
            const logSpy = jest.spyOn(titanicInstance, 'log');
            expect(titanicInstance.playerGameData[0].shipPlacement).toBeUndefined();
            titanicInstance.playerGameData.push(daphne);

            titanicInstance.handleDisconnect(testID);
            expect(titanicInstance.playerGameData[0].shipPlacement).toEqual([-1]);
            expect(checkConclusionSpy).toBeCalled();
            expect(logSpy)
                .toBeCalledWith('O jogador Fred desconectou-se e não poderá mais participar desta rodada.');
        });
    });

    //TODO: testes para finishGame
});
