import { HubConnection } from '@microsoft/signalr';
import { from, of, BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Wraps a SignalR HubConnection for use with RxJS.
 *
 * This can be used on its own by passing in an existing HubConnection. It is expected that this is instantiated with
 * the NgxSignalrFactory.createHubConnection() method.
 */
export class SignalrHubConnection {
  /**
   * Constructor.
   *
   * @param {HubConnection} _connection
   *   A hub connection. If the connection has not been started, then it will be started.
   */
  constructor(private _connection: HubConnection) {}

  getConnection(): HubConnection {
    return this._connection;
  }

  /**
   * Forces the connection to be stopped.
   *
   * @returns {Observable<boolean>}
   */
  stop(): Observable<boolean> {
    return from(this._connection.stop())
      .pipe(
        map(() => true),
        catchError((err) => {
          console.error(err);
          return of(false);
        }),
      );
  }

  /**
   * Subscribes to a method on the connection.
   *
   * This is used to listen to messages from the hub.
   *
   * @param {String} method
   *   The method to start observe.
   */
  on<T>(method: string): BehaviorSubject<T> {
    const subject = new BehaviorSubject<T>(null);

    this._connection.on(method, subject.next);

    return subject;
  }

  /**
   * Unsubscribes from a method sent from the connection.
   *
   * This is used to remove a specific listener or all listeners from the hub.
   *
   * @param {String} method
   *   The method to stop listening.
   * @param {BehaviorSubject<any>?} subject
   *   An optional subject to stop observing.
   */
  off(method: string, subject?: BehaviorSubject<any>): void {
    if (subject) {
      this._connection.off(method, subject.next);
      subject.complete();
    } else {
      this._connection.off(method);
    }
  }

  /**
   * Calls the method on the connection that immediately resolves.
   *
   * If any of the args is of IStreamResult<T>, then this will be used in a stream context where the client is
   * streaming text to the server with each subsequent call.
   *
   * @param {String} method
   *   The method to use on the connection.
   *
   * @returns {Observable<boolean>}
   */
  send(method: string, ...args: any[]): Observable<boolean> {
    return from(this._connection.send(method, ...args)).pipe(map(() => true), catchError(() => of(false)));
  }

  /**
   * Calls the method on the connection.
   *
   * @param {String} method
   *   The method to use on the connection.
   *
   * @returns {Observable<T>}
   */
  invoke<T>(method: string, ...args: any[]): Observable<T> {
    return from(this._connection.invoke(method, ...args)).pipe(map((data: T) => data));
  }

  /**
   * Subscribes to a stream from the connection.
   *
   * @param {String} method
   *   The method to use on the connection.
   *
   * @returns {BehaviorSubject<T>}
   */
  stream<T>(method: string, ...args: any[]): BehaviorSubject<T> {
    const subject = new BehaviorSubject<T>(null);
    this._connection
      .stream(method, ...args)
      .subscribe(subject);

    return subject;
  }
}
