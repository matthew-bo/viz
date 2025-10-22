"use strict";
/* eslint-disable-next-line no-unused-vars */
function __export(m) {
/* eslint-disable-next-line no-prototype-builtins */
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line no-unused-vars */
var jtv = require('@mojotech/json-type-validation');
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require('@daml/types');
/* eslint-disable-next-line no-unused-vars */
var damlLedger = require('@daml/ledger');

var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');


exports.Payment = damlTypes.assembleTemplate(
{
  templateId: 'c688c8bf67f387801bf06c305159c395dc96bb7aa2808d639af0995b31148557:Payment:Payment',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({sender: damlTypes.Party.decoder, receiver: damlTypes.Party.decoder, amount: damlTypes.Numeric(10).decoder, currency: damlTypes.Text.decoder, description: damlTypes.Text.decoder, submittedAt: damlTypes.Time.decoder, committedAt: damlTypes.Time.decoder, rwaType: damlTypes.Optional(damlTypes.Text).decoder, rwaDetails: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    sender: damlTypes.Party.encode(__typed__.sender),
    receiver: damlTypes.Party.encode(__typed__.receiver),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    currency: damlTypes.Text.encode(__typed__.currency),
    description: damlTypes.Text.encode(__typed__.description),
    submittedAt: damlTypes.Time.encode(__typed__.submittedAt),
    committedAt: damlTypes.Time.encode(__typed__.committedAt),
    rwaType: damlTypes.Optional(damlTypes.Text).encode(__typed__.rwaType),
    rwaDetails: damlTypes.Optional(damlTypes.Text).encode(__typed__.rwaDetails),
  };
}
,
  Archive: {
    template: function () { return exports.Payment; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.Payment);



exports.Reject = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Accept = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.PaymentRequest = damlTypes.assembleTemplate(
{
  templateId: 'c688c8bf67f387801bf06c305159c395dc96bb7aa2808d639af0995b31148557:Payment:PaymentRequest',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({sender: damlTypes.Party.decoder, receiver: damlTypes.Party.decoder, amount: damlTypes.Numeric(10).decoder, currency: damlTypes.Text.decoder, description: damlTypes.Text.decoder, submittedAt: damlTypes.Time.decoder, rwaType: damlTypes.Optional(damlTypes.Text).decoder, rwaDetails: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    sender: damlTypes.Party.encode(__typed__.sender),
    receiver: damlTypes.Party.encode(__typed__.receiver),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    currency: damlTypes.Text.encode(__typed__.currency),
    description: damlTypes.Text.encode(__typed__.description),
    submittedAt: damlTypes.Time.encode(__typed__.submittedAt),
    rwaType: damlTypes.Optional(damlTypes.Text).encode(__typed__.rwaType),
    rwaDetails: damlTypes.Optional(damlTypes.Text).encode(__typed__.rwaDetails),
  };
}
,
  Archive: {
    template: function () { return exports.PaymentRequest; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Reject: {
    template: function () { return exports.PaymentRequest; },
    choiceName: 'Reject',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Reject.decoder; }),
    argumentEncode: function (__typed__) { return exports.Reject.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Accept: {
    template: function () { return exports.PaymentRequest; },
    choiceName: 'Accept',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Accept.decoder; }),
    argumentEncode: function (__typed__) { return exports.Accept.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Payment).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Payment).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.PaymentRequest);

