'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const example_1 = __importDefault(require('./example'));
test('adds 1 + 2 to equal 3', () => {
  expect((0, example_1.default)(1, 2)).toBe(3);
});
