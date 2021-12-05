export const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export enum TemperatureUnits {
	degreeCelsius = '°C',
	degreesFahrenheit = '°F',
	kelvin = 'K'
}

export class Temperature {
	readonly value: number;
	readonly unit: TemperatureUnits;

	constructor(value: number, unit = TemperatureUnits.degreeCelsius) {
		this.value = value;
		this.unit = unit;
	}

	rounded(decimalPlaces = 1) {
		return round(this.value, decimalPlaces);
	}

	toCelsius() {
		switch (this.unit) {
			case TemperatureUnits.degreesFahrenheit: {
				return new Temperature(((this.value - 32) * 5) / 9, TemperatureUnits.degreeCelsius);
			}
			case TemperatureUnits.kelvin: {
				return new Temperature(this.value - 273.15, TemperatureUnits.degreeCelsius);
			}
			default:
				return this;
		}
	}

	toFahrenheit() {
		switch (this.unit) {
			case TemperatureUnits.degreeCelsius: {
				return new Temperature((this.value * 9) / 5 + 32, TemperatureUnits.degreesFahrenheit);
			}
			case TemperatureUnits.kelvin: {
				return new Temperature(((this.value - 273, 15) * 9) / 5 + 32, TemperatureUnits.degreesFahrenheit);
			}
			default:
				return this;
		}
	}

	toKelvin() {
		switch (this.unit) {
			case TemperatureUnits.degreeCelsius: {
				return new Temperature(this.value + 273.15, TemperatureUnits.kelvin);
			}
			case TemperatureUnits.degreesFahrenheit: {
				return new Temperature(((this.value - 32) * 5) / 9 + 273.15, TemperatureUnits.kelvin);
			}
			default:
				return this;
		}
	}
}

export class Humidity {
	readonly value: number;
	readonly unit = '%';

	constructor(value: number) {
		this.value = value;
	}

	rounded(decimalPlaces = 1) {
		return round(this.value, decimalPlaces);
	}
}

export function round(value: number, decimalPlaces: number) {
	if (value % 1 != 0) {
		const i = Math.pow(10, decimalPlaces);
		return Math.round((value + Number.EPSILON) * i) / i;
	}

	return value;
}

/**
 * @author https://github.com/bbx10/node-htu21d/blob/135e81b53ab5e98282cb16ea9d27ce193dc9bf0a/index.js#L82
 */
export function calcTemp(data: Buffer) {
	if (data.length === 3 && calcCRC8(data, 3)) {
		const rawtemp = ((data[0] << 8) | data[1]) & 0xfffc;
		const temperature = (rawtemp / 65536.0) * 175.72 - 46.85;

		return round(temperature, 2);
	}

	throw new Error('The read data are invalid!');
}

/**
 * @author https://github.com/bbx10/node-htu21d/blob/135e81b53ab5e98282cb16ea9d27ce193dc9bf0a/index.js#L109
 */
export function calcHumi(data: Buffer) {
	if (data.length === 3 && calcCRC8(data, 3)) {
		const rawhumi = ((data[0] << 8) | data[1]) & 0xfffc;
		const humidity = (rawhumi / 65536.0) * 125.0 - 6.0;

		return round(humidity, 1);
	}

	throw new Error('The read data are invalid!');
}

/**
 * @author https://github.com/bbx10/node-htu21d/blob/135e81b53ab5e98282cb16ea9d27ce193dc9bf0a/index.js#L129
 */
function calcCRC8(buf: Buffer, len: number) {
	let dataAndCRC;

	if (len === null) return -1;
	if (len != 3) return -1;
	if (buf === null) return -1;

	dataAndCRC = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8);
	for (let i = 0; i < 24; i++) {
		if (dataAndCRC & 0x80000000) dataAndCRC ^= 0x98800000;
		dataAndCRC <<= 1;
	}

	return dataAndCRC === 0;
}
