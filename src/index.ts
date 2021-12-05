import { I2CBus, openSync } from 'i2c-bus';
import { promisify } from 'util';
import { I2CADDR, READHUMI_NOHHOLD, READTEMP_NOHOLD } from './constants';
import { calcHumi, calcTemp, Humidity, sleep, Temperature } from './utilities';

export interface SensorOptions {
	address?: number;
	bus?: number;
}

export class SHT20 {
	private readonly address: number;
	private readonly bus: number;

	private readonly wire: I2CBus;

	private readonly i2cScan: () => Promise<number[]>;

	constructor(options: SensorOptions = {}) {
		this.address = options.address ?? I2CADDR;
		this.bus = options.bus ?? 1;

		this.wire = openSync(this.bus);

		this.i2cScan = promisify(this.wire.scan);
	}

	async scan(): Promise<unknown[]> {
		return this.i2cScan();
	}

	private async i2cRead(length: number): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			this.wire.i2cRead(this.address, length, Buffer.alloc(length), (err, bytesRead, buffer) => {
				if (err) {
					reject(err);
					return;
				}

				if (bytesRead !== length) {
					reject(new Error(`Expected to read ${length} bytes, but only read ${bytesRead} bytes`));
					return;
				}

				resolve(buffer);
			});
		});
	}

	private async i2cWrite(cmd: number): Promise<void> {
		const bCMD = Buffer.from([cmd]);

		return new Promise((resolve, reject) => {
			this.wire.i2cWrite(this.address, bCMD.length, bCMD, (err) => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}

	async readTemperature() {
		await this.i2cWrite(READTEMP_NOHOLD);
		await sleep(85);

		const temperatureData = await this.i2cRead(3);
		const temperature = calcTemp(temperatureData);

		return new Temperature(temperature);
	}

	async readHumidity() {
		await this.i2cWrite(READHUMI_NOHHOLD);
		await sleep(29);

		const humidityData = await this.i2cRead(3);
		const humidity = calcHumi(humidityData);

		return new Humidity(humidity);
	}

	async read() {
		return {
			temperature: await this.readTemperature(),
			humidity: await this.readHumidity()
		};
	}
}

// Provide legacy support
export default SHT20;

export { Humidity, Temperature, TemperatureUnits } from './utilities';
