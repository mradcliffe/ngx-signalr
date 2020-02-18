# @mradcliffe/ngx-signalr [![Build Status](https://travis-ci.org/mradcliffe/ngx-signalr.svg?branch=master)](https://travis-ci.org/mradcliffe/ngx-signalr)

> @mradcliffe/ngx-signalr is a [Angular](https://angular.io) module that provides an easy-to-use service to create [SignalR](https://docs.microsoft.com/en-us/aspnet/core/signalr/introduction) hub connections. It wraps common SignalR methods in [RxJS](https://rxjs.dev/) observables and allows http client interceptors (middleware) to be used in connections.

## Table of Contents

1. Installation
2. Usage
3. Contributing

## Installation

Confirm that your dependencies match for the Angular release you are using.

Angular | RxJS  | zone.js
------- | ----- | -------
^6      | ^6.2  | ^0.8
^7      | ^6.4  | ^0.8
^8      | ^6.5  | ^0.9
^9      | ^6.5  | N/A

* `npm install ngx-signalr`

## Usage

### Create a SignalrHubConnection

This provides a `SignalrFactory` with which will create and start a new [HubConnectios](https://docs.microsoft.com/en-us/javascript/api/%40microsoft/signalr/hubconnection?view=signalr-js-latest).

    this.signalrFactory
      .createHubConnection('https://example.com/hubs/test')
      .pipe(skipWhile((c: SignalrHubConnection) => c === null));


A `BehaviorSubject<SignalrHubConnection>` is returned from the factory. The `SignalrHubConnection` wraps the `HubConnection` methods in Observables.

### Work with SignalrHubConnection

    // Subscribes to the "counted" method on the hub.
    const subject = connection.on<number>('counted');
    subject.subscribe((n: number) => {});

    // Unsubscribe using this specific behavior subject for the "counted" method.
    connection.off('counted', subject);

    // Unsubscribe all "counted" methods.
    connection.off('counted');

    // Invokes the increment method on the hub with argument "count".
    const count = 5;
    connection.invoke<number>('increment', count)
      .subscribe((n: number) => {});

    // Send a method with arguments that only needs to check success.
    connection.send('foo', 'bar)
      .subscribe((success: boolean) => {
        if (success) {
          // Method was successful.
        } else {
          // Method was not successful.
        }
      });

## Contributing

Please read the [CONTRIBUTING](./CONTRIBUTING.md) document.
