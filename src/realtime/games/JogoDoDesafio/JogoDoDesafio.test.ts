import Store from '../../store';
import { Server } from 'socket.io';
import { JogoDoDesafio } from './JogoDoDesafio';

describe('JogoDoDesafio Class', () => {
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
        const testRoom = Store.getInstance().rooms.get('ABCD');
        if (!testRoom) return;
        testRoom.currentGame = null;
    });

    describe('Constructor', () => {
        it('should return gameType as "dynamic"', () => {
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');
            expect(jogoDoDesafioInstance.gameType).toEqual('dynamic');
        });

        it('should return gameName as "Jogo do Desafio"', () => {
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');
            expect(jogoDoDesafioInstance.gameName).toEqual('Jogo do Desafio');
        });

        it('should initiate playerGameData as suggestions array', () => {
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');
            expect(jogoDoDesafioInstance.playerGameData).toEqual(
                JogoDoDesafio.suggestions
            );
        });
    });

    describe('getSuggestions method', () => {
        it('should return 3 sentences from the suggestions pool', () => {
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');
            const suggestions = jogoDoDesafioInstance.getSuggestions();

            expect(suggestions.length).toEqual(3);
            suggestions.forEach((suggestion) => {
                expect(jogoDoDesafioInstance.playerGameData).toContain(suggestion);
            });
        });
    });

    describe('handleMessage method', () => {
        it('should send suggestions when prompted', () => {
            const logSpy = jest
                .spyOn(global.console, 'log')
                .mockImplementation(() => {
                    return;
                });
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');

            jogoDoDesafioInstance.handleMessage(
                testID,
                'get-suggestions'
            );
            expect(logSpy).toBeCalledWith(
                'Veio buscar as sugestões do Jogo do Desafio'
            );
        });

        it('should reveal suggestions when prompted', () => {
            const logSpy = jest
                .spyOn(global.console, 'log')
                .mockImplementation(() => {
                    return;
                });
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');

            jogoDoDesafioInstance.handleMessage(
                testID,
                'show-suggestions'
            );
            expect(logSpy).toBeCalledWith(
                'Revelando sugestões'
            );
        });
    });

    describe('handleDisconnect method', () => {
        it('should log the message received', () => {
            const logSpy = jest
                .spyOn(global.console, 'log')
                .mockImplementation(() => {
                    return;
                });
            const jogoDoDesafioInstance = new JogoDoDesafio(io, 'ABCD');

            jogoDoDesafioInstance.handleDisconnect(testID);
            expect(logSpy).toBeCalledWith(`${testID} - Player disconnected`);
        });
    });
});
