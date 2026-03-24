// Generado automaticamente por Compiler.js
import ClientConnector from './ClientConnector.js';

const POOL_SIZE = 10;

class CalculatorProxy {
    constructor() {
        this.pool = Array.from({ length: POOL_SIZE }, () => new ClientConnector());
    }

    _pick() {
        return this.pool.reduce((best, c) =>
            c._queue.length < best._queue.length ? c : best
        );
    }

    async add(x, y) {
        return await this._pick().send({ class: 'Calculator', method: 'add', params: [x, y] });
    }
    async subtract(x, y) {
        return await this._pick().send({ class: 'Calculator', method: 'subtract', params: [x, y] });
    }
    async multiply(x, y) {
        return await this._pick().send({ class: 'Calculator', method: 'multiply', params: [x, y] });
    }
    async divide(x, y) {
        return await this._pick().send({ class: 'Calculator', method: 'divide', params: [x, y] });
    }

    disconnect() {
        this.pool.forEach(c => c.disconnect());
    }
}

const calculatorProxy = new CalculatorProxy();
export default calculatorProxy;
