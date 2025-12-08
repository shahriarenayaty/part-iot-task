export enum OPERATOR {
	GT = ">",
	LT = "<",
	EQ = "=",
}

export type Operator = `${OPERATOR}`;

export const OperatorArray: Operator[] = Object.values(OPERATOR);

export function isOperator(value: string): value is Operator {
	return OperatorArray.includes(value as Operator);
}
