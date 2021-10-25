import prettyFactory from "../../";
import { expectType } from "tsd";

import PinoPretty, { PinoPretty as PinoPrettyNamed, PrettyOptions } from "../../";
import PinoPrettyDefault from "../../";
import * as PinoPrettyStar from "../../";
import PinoPrettyCjsImport = require ("../../");
import Prettifier = PinoPretty.Prettifier;
const PinoPrettyCjs = require("../../");

const options: PinoPretty.PrettyOptions = {
  colorize: true,
  crlf: false,
  errorLikeObjectKeys: ["err", "error"],
  errorProps: "",
  hideObject: true,
  levelKey: "level",
  levelLabel: "foo",
  messageFormat: false,
  ignore: "",
  levelFirst: false,
  messageKey: "msg",
  timestampKey: "timestamp",
  translateTime: "UTC:h:MM:ss TT Z",
  singleLine: false,
  customPrettifiers: {
    key: (value) => {
      return value.toString().toUpperCase();
    }
  }
};

const options2: PrettyOptions = {
  colorize: true,
  crlf: false,
  errorLikeObjectKeys: ["err", "error"],
  errorProps: "",
  hideObject: true,
  levelKey: "level",
  levelLabel: "foo",
  messageFormat: false,
  ignore: "",
  levelFirst: false,
  messageKey: "msg",
  timestampKey: "timestamp",
  translateTime: "UTC:h:MM:ss TT Z",
  singleLine: false,
  customPrettifiers: {
    key: (value) => {
      return value.toString().toUpperCase();
    }
  }
};

const pretty = prettyFactory(options);
expectType<Prettifier>(pretty);

expectType<Prettifier>(PinoPrettyNamed(options));
expectType<Prettifier>(PinoPrettyDefault(options));
expectType<Prettifier>(PinoPrettyStar.PinoPretty(options));
expectType<Prettifier>(PinoPrettyStar.default(options));
expectType<Prettifier>(PinoPrettyCjsImport.PinoPretty(options));
expectType<Prettifier>(PinoPrettyCjsImport.default(options));
expectType<any>(PinoPrettyCjs(options));

expectType<string>(pretty({ foo: "bar" }));
expectType<string>(pretty('dummy'));
