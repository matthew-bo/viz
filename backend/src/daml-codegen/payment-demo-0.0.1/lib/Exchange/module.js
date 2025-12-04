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

var pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 = require('@payment-demo/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662');


exports.Exchange = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Exchange:Exchange',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, offering: exports.ExchangeOffer.decoder, requesting: exports.ExchangeOffer.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, createdAt: damlTypes.Time.decoder, acceptedAt: damlTypes.Time.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    offering: exports.ExchangeOffer.encode(__typed__.offering),
    requesting: exports.ExchangeOffer.encode(__typed__.requesting),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
    createdAt: damlTypes.Time.encode(__typed__.createdAt),
    acceptedAt: damlTypes.Time.encode(__typed__.acceptedAt),
  };
}
,
  Archive: {
    template: function () { return exports.Exchange; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.Exchange);



exports.RejectExchange = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.CancelExchange = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.AcceptExchange = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ExchangeProposal = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Exchange:ExchangeProposal',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, offering: exports.ExchangeOffer.decoder, requesting: exports.ExchangeOffer.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, createdAt: damlTypes.Time.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    offering: exports.ExchangeOffer.encode(__typed__.offering),
    requesting: exports.ExchangeOffer.encode(__typed__.requesting),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
    createdAt: damlTypes.Time.encode(__typed__.createdAt),
  };
}
,
  Archive: {
    template: function () { return exports.ExchangeProposal; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  CancelExchange: {
    template: function () { return exports.ExchangeProposal; },
    choiceName: 'CancelExchange',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.CancelExchange.decoder; }),
    argumentEncode: function (__typed__) { return exports.CancelExchange.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  RejectExchange: {
    template: function () { return exports.ExchangeProposal; },
    choiceName: 'RejectExchange',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RejectExchange.decoder; }),
    argumentEncode: function (__typed__) { return exports.RejectExchange.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  AcceptExchange: {
    template: function () { return exports.ExchangeProposal; },
    choiceName: 'AcceptExchange',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptExchange.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptExchange.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.Exchange).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.Exchange).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ExchangeProposal);



exports.ExchangeOffer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({offerType: exports.OfferType.decoder, cashAmount: damlTypes.Optional(damlTypes.Numeric(10)).decoder, assetId: damlTypes.Optional(damlTypes.Text).decoder, assetName: damlTypes.Optional(damlTypes.Text).decoder, assetValue: damlTypes.Optional(damlTypes.Numeric(10)).decoder, }); }),
  encode: function (__typed__) {
  return {
    offerType: exports.OfferType.encode(__typed__.offerType),
    cashAmount: damlTypes.Optional(damlTypes.Numeric(10)).encode(__typed__.cashAmount),
    assetId: damlTypes.Optional(damlTypes.Text).encode(__typed__.assetId),
    assetName: damlTypes.Optional(damlTypes.Text).encode(__typed__.assetName),
    assetValue: damlTypes.Optional(damlTypes.Numeric(10)).encode(__typed__.assetValue),
  };
}
,
};



exports.OfferType = {
  Cash: 'Cash',
  RealEstate: 'RealEstate',
  PrivateEquity: 'PrivateEquity',
  keys: ['Cash','RealEstate','PrivateEquity',],
  decoder: damlTypes.lazyMemo(function () { return jtv.oneOf(jtv.constant(exports.OfferType.Cash), jtv.constant(exports.OfferType.RealEstate), jtv.constant(exports.OfferType.PrivateEquity)); }),
  encode: function (__typed__) { return __typed__; },
};

