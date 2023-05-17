import Store from '../../store';
import { Server } from 'socket.io';
import { JogoDaVerdade } from './JogoDaVerdade';

describe('JogoDaVerdade Class', () => {
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
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');
            expect(jogoDaVerdadeInstance.gameType).toEqual('dynamic');
        });

        it('should return gameName as "Jogo da Verdade"', () => {
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');
            expect(jogoDaVerdadeInstance.gameName).toEqual('Jogo da Verdade');
        });

        it('should initiate playerGameData as suggestions array', () => {
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');
            expect(jogoDaVerdadeInstance.playerGameData).toEqual(
                JogoDaVerdade.suggestions
            );
        });
    });

    describe('getSuggestions method', () => {
        it('should return 3 sentences from the suggestions pool', () => {
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');
            const suggestions = jogoDaVerdadeInstance.getSuggestions();

            expect(suggestions.length).toEqual(3);
            suggestions.forEach((suggestion) => {
                expect(jogoDaVerdadeInstance.playerGameData).toContain(suggestion);
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
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');

            jogoDaVerdadeInstance.handleMessage(
                testID,
                'get-suggestions'
            );
            expect(logSpy).toBeCalledWith(
                'Veio buscar as sugestões do Jogo da Verdade'
            );
        });

        it('should reveal suggestions when prompted', () => {
            const logSpy = jest
                .spyOn(global.console, 'log')
                .mockImplementation(() => {
                    return;
                });
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');

            jogoDaVerdadeInstance.handleMessage(
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
            const jogoDaVerdadeInstance = new JogoDaVerdade(io, 'ABCD');

            jogoDaVerdadeInstance.handleDisconnect(testID);
            expect(logSpy).toBeCalledWith(`${testID} - Player disconnected`);
        });
    });
});
