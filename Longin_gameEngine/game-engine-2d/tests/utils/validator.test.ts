import { JsonValidator, ValidationSchema } from '../../src/utils/json-validator';

describe('JsonValidator', () => {

    it('should validate simple types', () => {
        const schema: ValidationSchema = { type: 'string' };
        expect(JsonValidator.validate('hello', schema)).toBe(true);
        expect(JsonValidator.validate(123, schema)).toBe(false);
    });

    it('should validate complex objects', () => {
        const schema: ValidationSchema = {
            type: 'object',
            required: ['name', 'age'],
            properties: {
                name: { type: 'string' },
                age: { type: 'number' }
            }
        };

        expect(JsonValidator.validate({ name: 'John', age: 30 }, schema)).toBe(true);
        expect(JsonValidator.validate({ name: 'John' }, schema)).toBe(false); // missing age
        expect(JsonValidator.validate({ name: 'John', age: '30' }, schema)).toBe(false); // wrong type
    });

    it('should validate arrays', () => {
        const schema: ValidationSchema = {
            type: 'array',
            items: { type: 'number' }
        };

        expect(JsonValidator.validate([1, 2, 3], schema)).toBe(true);
        expect(JsonValidator.validate([1, '2'], schema)).toBe(false);
        expect(JsonValidator.validate({ a: 1 }, schema)).toBe(false);
    });
});
