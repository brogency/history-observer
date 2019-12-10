import uuid from 'uuid/v4';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

interface Subscribers {
  [id: string]: CallableFunction;
}

export class LocationCast {
  public readonly search: string = '';

  public readonly pathname: string = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly state: any;

  public constructor(history: History, location: Location) {
    this.state = history.state;
    this.search = location.search;
    this.pathname = location.pathname;
  }

  public isUpdated = (history: History, location: Location): boolean => this.pathname !== location.pathname
    || this.search !== location.search
    || !isEqual(
      this.state,
      history.state,
    )
}


class HistoryObserver {
  private subscribers: Subscribers = {};

  private watcherInterval?: number;

  public location: LocationCast;

  public constructor() {
    this.location = new LocationCast(window.history, window.location);
  }

  public subscribe = (subscriber: CallableFunction): CallableFunction => {
    const id = uuid();
    this.subscribers[id] = subscriber;
    this.updateWatcher();

    return (): void => this.unsubscribe(id);
  };

  // For compatibility with history https://www.npmjs.com/package/history
  public listen = this.subscribe;

  private unsubscribe(id: string): void {
    delete this.subscribers[id];
    this.updateWatcher();
  }

  private updateWatcher = (): void => {
    if (!isEmpty(this.subscribers) && !this.watcherInterval) {
      this.startWatcher();
    } else if (this.watcherInterval) {
      this.stopWatcher();
    }
  };

  private startWatcher = (): void => {
    this.watcherInterval = window.setInterval(this.watch, 100);
  };

  private stopWatcher = (): void => {
    window.clearInterval(this.watcherInterval);
    this.watcherInterval = undefined;
  };

  private watch = (): void => {
    if (this.location && this.location.isUpdated(window.history, window.location)) {
      const locationCast = new LocationCast(window.history, window.location);
      this.location = locationCast;
      this.callSubscribers(locationCast);
    }
  };

  private callSubscribers = (locationCast: LocationCast): void => Object.keys(this.subscribers).forEach(
    (id: string): void => {
      const callback = this.subscribers[id];
      callback(locationCast);
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public push(path: string, state: any): void {
    window.history.pushState(state, '', path);
  }
}


export default HistoryObserver;
