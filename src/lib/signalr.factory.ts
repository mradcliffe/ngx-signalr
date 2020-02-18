import { Injectable } from '@angular/core';
import {
  HttpTransportType,
  HubConnectionBuilder,
  JsonHubProtocol,
  LogLevel,
  IHttpConnectionOptions,
  IHubProtocol,
} from '@microsoft/signalr';
import { from, BehaviorSubject } from 'rxjs';

import { SignalrHttpClientWrapper } from './signalr-http-client.wrapper';
import { SignalrHubConnection } from './signalr-hub-connection';

export interface SignalrOptions {
  options: IHttpConnectionOptions;
  protocol: IHubProtocol;
  builder?: HubConnectionBuilder;
}

export const defaultSignalrOptions: SignalrOptions = {
  options: {
    transport: HttpTransportType.None,
    logger: LogLevel.Error,
  },
  protocol: new JsonHubProtocol(),
};

@Injectable()
export class SignalrFactory {
  constructor(private httpClient: SignalrHttpClientWrapper) {}

  /**
   * Creates and subscribes to a new signalr hub connection.
   *
   * @example
   * service.createHubConnection('https://example.com/my/hub')
   *   .pipe(
   *      skipWhile(c => c === null),
   *      mergeMap(c => c.on('thing'))
   *    )
   *    .subscribe((someThing) => {}, (err) => {}, () => {});
   *
   * @param {string} endpoint
   *   The full hub URL including additional query parameters that may be necessary to pass-through a web socket
   *   connection.
   * @param {SignalrOptions} options
   *   Create the connection using specific configuration.
   * @param {IHttpConnectionOptions} options.options
   *   URL Options to apply to the connection. An Angular HttpClient wrapper will be used as the httpClient option
   *   by default. This allows for HTTP Middleware (Interceptors) to be applied to Signalr hub requests.
   * @param {IHubProtocol} options.protocol
   *   The hub protocol to use. JsonHubProtocol will be used by default.
   * @param {HubConnectionBuilder} options.builder
   *   A preconfigured HubConnectionBuilder instance to use instead of creating a new one. This is most useful
   *   when testing signalr.
   *
   * @returns {BehaviorSubject<HubConnection>}
   *   The connection returned in the subject is ready to use.
   */
  createHubConnection(endpoint: string, options: SignalrOptions = defaultSignalrOptions): BehaviorSubject<SignalrHubConnection> {
    const subject = new BehaviorSubject<SignalrHubConnection>(null);
    const urlOptions = Object.assign({ httpClient: this.httpClient }, options.options);

    const b = options.builder ? options.builder : new HubConnectionBuilder();
    b
      .withUrl(endpoint, urlOptions)
      .withHubProtocol(options.protocol);

    if (b.withAutomaticReconnect) {
      b.withAutomaticReconnect();
    }

    const connection = b.build();
    const wrappedConnection = new SignalrHubConnection(connection);

    // Subject will be completed when the connection is closed.
    connection.onclose((error?: Error) => {
      if (error) {
        subject.error(error);
      }
      subject.complete();
    });

    connection.onreconnected(() => {
      subject.next(wrappedConnection);
    });

    connection.onreconnecting((error?: Error) => {
      if (error) {
        subject.error(error);
      }
    });

    from(connection.start())
      .subscribe(() => {
        subject.next(wrappedConnection);
      }, (error) => {
        subject.error(error);
        subject.complete();
      });

    return subject;
  }
}
