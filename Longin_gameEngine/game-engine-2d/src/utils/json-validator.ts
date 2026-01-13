import { Logger } from './logger';

export interface ValidationSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties?: Record<string, ValidationSchema>;
    required?: string[];
    items?: ValidationSchema;
}

export class JsonValidator {

    public static validate(data: any, schema: ValidationSchema): boolean {
        if (typeof data === 'undefined' || data === null) return false;

        if (schema.type === 'string' && typeof data !== 'string') return false;
        if (schema.type === 'number' && typeof data !== 'number') return false;
        if (schema.type === 'boolean' && typeof data !== 'boolean') return false;

        if (schema.type === 'object') {
            if (typeof data !== 'object' || Array.isArray(data)) return false;

            if (schema.required) {
                for (const field of schema.required) {
                    if (!(field in data)) return false;
                }
            }

            if (schema.properties) {
                for (const [key, propSchema] of Object.entries(schema.properties)) {
                    if (key in data) {
                        if (!this.validate(data[key], propSchema)) return false;
                    }
                }
            }
        }

        if (schema.type === 'array') {
            if (!Array.isArray(data)) return false;
            if (schema.items) {
                for (const item of data) {
                    if (!this.validate(item, schema.items)) return false;
                }
            }
        }

        return true;
    }
}
