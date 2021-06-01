import nats, { Stan } from 'node-nats-streaming';

class NatsWrapper {
  private _client?: Stan;

  //--- typescript getter
  get client() {
    if (!this._client) {
      throw new Error('Cannot access NATS client before connecting');
    }
    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    this._client = nats.connect(clusterId, clientId, {
      url,
      // maxPubAcksInflight: 5,
      // reconnect: true,
      // maxReconnectAttempts: 10,
    });

    return new Promise<void>((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to NATS');
        resolve();
      });
      this.client.on('error', (err) => {
        console.error('Error from NATS', err);
        reject(err);
      });
    });

    // this._client.on('connect', () => {
    //   console.log('Connected to NATS');
    // });
  }
}

//--- export a singleton object
export const natsWrapper = new NatsWrapper();
