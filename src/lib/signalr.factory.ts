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

/**
 * SignalR Options
 *
 * @param {@microsoft/signalr.IHttpConnectionOptions} options
 *   URL Options to apply to the connection. An Angular HttpClient wrapper will be used as the httpClient option
 *   by default. This allows for HTTP Middleware (Interceptors) to be applied to Signalr hub requests.
 * @param {@microsoft/signalr.HttpClient} options.httpClient
 * @param {@microsoft/signalr.HttpTransportType} options.transport
 *   The transport type to use. This defaults to HttpTransportType.None.
 * @param {@microsoft/signalr.ILogger} options.logger
 *   The log level to use. This defaults to LogLevel.Error.
 * @param {Function} options.accessTokenFactory
 *   A function that returns a string or a Promise resolving as a string.
 * @param {boolean} options.skipNegotiation
 *   A boolean indicating if negotation should be skipped.
 * @param {boolean} options.logMessageContent
 *   A boolean indicating whether content should be logged. Enabling this may be a security risk.
 * @param {@microsoft/signalr.IHubProtocol} protocol
 *   The hub protocol to use. JsonHubProtocol will be used by default.
 * @param {@microsoft/signalr.HubConnectionBuilder} builder
 *   A preconfigured HubConnectionBuilder instance to use instead of creating a new one. This is most useful
 *   when creating unit tests where SignalR is not available.
 */
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
    wrappedConnection.getConnection().onclose((error?: Error) => {
      if (error) {
        subject.error(error);
      }
      subject.complete();
    });

    wrappedConnection.getConnection().onreconnected(() => {
      subject.next(wrappedConnection);
    });

    wrappedConnection.getConnection().onreconnecting((error?: Error) => {
      if (error) {
        subject.error(error);
      }
    });

    from(wrappedConnection.getConnection().start())
    .subscribe(() => {
      subject.next(wrappedConnection);
    }, (error) => {
      subject.error(error);
      subject.complete();
    });

    return subject;
  }
}
