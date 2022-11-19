import { Transport } from "@ledgerhq/live-app-sdk";

type MessageHandler = (payload: unknown) => Promise<void>;

declare global {
  interface Window {
    ElectronWebview: {
      postMessage(msg: string): void;
    };
    ReactNativeWebView: {
      postMessage(msg: string): void;
    };
  }
}

export class WindowMessageProxyTransport implements Transport {
  private target: Window;
  private iframe: React.RefObject<HTMLIFrameElement>;
  private _onMessage?: MessageHandler;

  constructor(
    iframe: React.RefObject<HTMLIFrameElement>,
    target: Window = window
  ) {
    this.target = target;
    this.iframe = iframe;
  }

  connect = (): void => {
    this.target.addEventListener("message", this._onMessageEvent, false);
    console.debug("event listeners registered");
  };

  disconnect = (): void => {
    this.target.removeEventListener("message", this._onMessageEvent, false);
    console.debug("event listeners unregistered");
  };

  _onMessageEvent = (event: MessageEvent): void => {
    if (this._onMessage) {
      console.log("received message event", event);
      if (
        event.origin !== this.target.location.origin &&
        event.data &&
        typeof event.data === "string"
      ) {
        try {
          const payload = JSON.parse(event.data.toString());

          if (payload.jsonrpc) {
            console.log("received message", payload);
            if (payload.method) {
              this.send(payload);
            } else {
              this._onMessage(payload);
              this.iframe.current?.contentWindow?.postMessage(
                JSON.stringify(payload),
                "*"
              );
            }
          } else {
            console.debug("not a jsonrpc message");
          }
        } catch (error) {
          console.warn("parse error");
          this._onMessage(error);
        }
      } else {
        console.debug("ignoring message same origin");
      }
    } else {
      console.debug("no handler registered");
    }
  };

  set onMessage(handler: MessageHandler | undefined) {
    this._onMessage = handler;
  }

  get onMessage(): MessageHandler | undefined {
    return this._onMessage;
  }

  send = (response: unknown): Promise<void> => {
    try {
      if (this.target.ReactNativeWebView) {
        console.log("sending message (ReactNativeWebview)", response);
        this.target.ReactNativeWebView.postMessage(JSON.stringify(response));
      } else if (this.target.ElectronWebview) {
        console.log("sending message (ElectronWebview)", response);
        this.target.ElectronWebview.postMessage(JSON.stringify(response));
      } else {
        console.log("sending message", response);
        this.target.top?.postMessage(JSON.stringify(response), "*");
      }
      return Promise.resolve();
    } catch (error) {
      console.error("unexpected error on send", error);
      return Promise.reject(error);
    }
  };
}
