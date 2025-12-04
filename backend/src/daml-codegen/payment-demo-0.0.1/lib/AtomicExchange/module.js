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

var Asset = require('../Asset/module');


exports.ExecuteProposalPE = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ProposeExchangeWithPrivateEquity = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:ProposeExchangeWithPrivateEquity',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({privateEquityToEscrow: damlTypes.ContractId(Asset.PrivateEquityToken).decoder, proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, requesting: Asset.RequestSpec.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    privateEquityToEscrow: damlTypes.ContractId(Asset.PrivateEquityToken).encode(__typed__.privateEquityToEscrow),
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    requesting: Asset.RequestSpec.encode(__typed__.requesting),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
  };
}
,
  Archive: {
    template: function () { return exports.ProposeExchangeWithPrivateEquity; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  ExecuteProposalPE: {
    template: function () { return exports.ProposeExchangeWithPrivateEquity; },
    choiceName: 'ExecuteProposalPE',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteProposalPE.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteProposalPE.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.EscrowedExchangeProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.EscrowedExchangeProposal).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ProposeExchangeWithPrivateEquity);



exports.ExecuteProposalRE = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ProposeExchangeWithRealEstate = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:ProposeExchangeWithRealEstate',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({realEstateToEscrow: damlTypes.ContractId(Asset.RealEstateToken).decoder, proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, requesting: Asset.RequestSpec.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    realEstateToEscrow: damlTypes.ContractId(Asset.RealEstateToken).encode(__typed__.realEstateToEscrow),
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    requesting: Asset.RequestSpec.encode(__typed__.requesting),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
  };
}
,
  ExecuteProposalRE: {
    template: function () { return exports.ProposeExchangeWithRealEstate; },
    choiceName: 'ExecuteProposalRE',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteProposalRE.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteProposalRE.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.EscrowedExchangeProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.EscrowedExchangeProposal).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.ProposeExchangeWithRealEstate; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ProposeExchangeWithRealEstate);



exports.ExecuteProposal = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ProposeExchangeWithCash = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:ProposeExchangeWithCash',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({cashToEscrow: damlTypes.ContractId(Asset.CashHolding).decoder, proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, requesting: Asset.RequestSpec.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    cashToEscrow: damlTypes.ContractId(Asset.CashHolding).encode(__typed__.cashToEscrow),
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    requesting: Asset.RequestSpec.encode(__typed__.requesting),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
  };
}
,
  ExecuteProposal: {
    template: function () { return exports.ProposeExchangeWithCash; },
    choiceName: 'ExecuteProposal',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.ExecuteProposal.decoder; }),
    argumentEncode: function (__typed__) { return exports.ExecuteProposal.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.EscrowedExchangeProposal).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.EscrowedExchangeProposal).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.ProposeExchangeWithCash; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ProposeExchangeWithCash);



exports.CompletedExchange = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:CompletedExchange',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, proposerGave: damlTypes.Text.decoder, responderGave: damlTypes.Text.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, createdAt: damlTypes.Time.decoder, completedAt: damlTypes.Time.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    proposerGave: damlTypes.Text.encode(__typed__.proposerGave),
    responderGave: damlTypes.Text.encode(__typed__.responderGave),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
    createdAt: damlTypes.Time.encode(__typed__.createdAt),
    completedAt: damlTypes.Time.encode(__typed__.completedAt),
  };
}
,
  Archive: {
    template: function () { return exports.CompletedExchange; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.CompletedExchange);



exports.RejectProposal = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.CancelProposal = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.AcceptWithPrivateEquity = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({responderPE: damlTypes.ContractId(Asset.PrivateEquityToken).decoder, }); }),
  encode: function (__typed__) {
  return {
    responderPE: damlTypes.ContractId(Asset.PrivateEquityToken).encode(__typed__.responderPE),
  };
}
,
};



exports.AcceptWithRealEstate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({responderRE: damlTypes.ContractId(Asset.RealEstateToken).decoder, }); }),
  encode: function (__typed__) {
  return {
    responderRE: damlTypes.ContractId(Asset.RealEstateToken).encode(__typed__.responderRE),
  };
}
,
};



exports.AcceptWithCash = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({responderCash: damlTypes.ContractId(Asset.CashHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    responderCash: damlTypes.ContractId(Asset.CashHolding).encode(__typed__.responderCash),
  };
}
,
};



exports.EscrowedExchangeProposal = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:AtomicExchange:EscrowedExchangeProposal',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({proposer: damlTypes.Party.decoder, responder: damlTypes.Party.decoder, proposerName: damlTypes.Text.decoder, responderName: damlTypes.Text.decoder, escrowedCash: damlTypes.Optional(Asset.EscrowedCash).decoder, escrowedRealEstate: damlTypes.Optional(Asset.EscrowedRealEstate).decoder, escrowedPrivateEquity: damlTypes.Optional(Asset.EscrowedPrivateEquity).decoder, requesting: Asset.RequestSpec.decoder, description: damlTypes.Optional(damlTypes.Text).decoder, createdAt: damlTypes.Time.decoder, }); }),
  encode: function (__typed__) {
  return {
    proposer: damlTypes.Party.encode(__typed__.proposer),
    responder: damlTypes.Party.encode(__typed__.responder),
    proposerName: damlTypes.Text.encode(__typed__.proposerName),
    responderName: damlTypes.Text.encode(__typed__.responderName),
    escrowedCash: damlTypes.Optional(Asset.EscrowedCash).encode(__typed__.escrowedCash),
    escrowedRealEstate: damlTypes.Optional(Asset.EscrowedRealEstate).encode(__typed__.escrowedRealEstate),
    escrowedPrivateEquity: damlTypes.Optional(Asset.EscrowedPrivateEquity).encode(__typed__.escrowedPrivateEquity),
    requesting: Asset.RequestSpec.encode(__typed__.requesting),
    description: damlTypes.Optional(damlTypes.Text).encode(__typed__.description),
    createdAt: damlTypes.Time.encode(__typed__.createdAt),
  };
}
,
  AcceptWithCash: {
    template: function () { return exports.EscrowedExchangeProposal; },
    choiceName: 'AcceptWithCash',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptWithCash.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptWithCash.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CompletedExchange).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CompletedExchange).encode(__typed__); },
  },
  AcceptWithRealEstate: {
    template: function () { return exports.EscrowedExchangeProposal; },
    choiceName: 'AcceptWithRealEstate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptWithRealEstate.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptWithRealEstate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CompletedExchange).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CompletedExchange).encode(__typed__); },
  },
  AcceptWithPrivateEquity: {
    template: function () { return exports.EscrowedExchangeProposal; },
    choiceName: 'AcceptWithPrivateEquity',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptWithPrivateEquity.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptWithPrivateEquity.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CompletedExchange).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CompletedExchange).encode(__typed__); },
  },
  CancelProposal: {
    template: function () { return exports.EscrowedExchangeProposal; },
    choiceName: 'CancelProposal',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.CancelProposal.decoder; }),
    argumentEncode: function (__typed__) { return exports.CancelProposal.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  RejectProposal: {
    template: function () { return exports.EscrowedExchangeProposal; },
    choiceName: 'RejectProposal',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.RejectProposal.decoder; }),
    argumentEncode: function (__typed__) { return exports.RejectProposal.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.EscrowedExchangeProposal; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.EscrowedExchangeProposal);

