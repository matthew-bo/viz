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


exports.TransferPrivateEquity = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newOwner: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
  };
}
,
};



exports.PrivateEquityToken = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Asset:PrivateEquityToken',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, assetId: damlTypes.Text.decoder, companyName: damlTypes.Text.decoder, industry: damlTypes.Text.decoder, ownershipPercentage: damlTypes.Numeric(10).decoder, valuation: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    assetId: damlTypes.Text.encode(__typed__.assetId),
    companyName: damlTypes.Text.encode(__typed__.companyName),
    industry: damlTypes.Text.encode(__typed__.industry),
    ownershipPercentage: damlTypes.Numeric(10).encode(__typed__.ownershipPercentage),
    valuation: damlTypes.Numeric(10).encode(__typed__.valuation),
  };
}
,
  Archive: {
    template: function () { return exports.PrivateEquityToken; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  TransferPrivateEquity: {
    template: function () { return exports.PrivateEquityToken; },
    choiceName: 'TransferPrivateEquity',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TransferPrivateEquity.decoder; }),
    argumentEncode: function (__typed__) { return exports.TransferPrivateEquity.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.PrivateEquityToken).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.PrivateEquityToken).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.PrivateEquityToken);



exports.TransferRealEstate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newOwner: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    newOwner: damlTypes.Party.encode(__typed__.newOwner),
  };
}
,
};



exports.RealEstateToken = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Asset:RealEstateToken',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, assetId: damlTypes.Text.decoder, name: damlTypes.Text.decoder, location: damlTypes.Text.decoder, propertyType: damlTypes.Text.decoder, squareFeet: damlTypes.Int.decoder, value: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    assetId: damlTypes.Text.encode(__typed__.assetId),
    name: damlTypes.Text.encode(__typed__.name),
    location: damlTypes.Text.encode(__typed__.location),
    propertyType: damlTypes.Text.encode(__typed__.propertyType),
    squareFeet: damlTypes.Int.encode(__typed__.squareFeet),
    value: damlTypes.Numeric(10).encode(__typed__.value),
  };
}
,
  TransferRealEstate: {
    template: function () { return exports.RealEstateToken; },
    choiceName: 'TransferRealEstate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TransferRealEstate.decoder; }),
    argumentEncode: function (__typed__) { return exports.TransferRealEstate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.RealEstateToken).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.RealEstateToken).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.RealEstateToken; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.RealEstateToken);



exports.TransferCash = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({recipient: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    recipient: damlTypes.Party.encode(__typed__.recipient),
  };
}
,
};



exports.CashHolding = damlTypes.assembleTemplate(
{
  templateId: '1d4773f2a2c352b819aa5e7b8eca2ab3586781c05db17148ffb8d56223b81723:Asset:CashHolding',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, amount: damlTypes.Numeric(10).decoder, currency: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    currency: damlTypes.Text.encode(__typed__.currency),
  };
}
,
  TransferCash: {
    template: function () { return exports.CashHolding; },
    choiceName: 'TransferCash',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TransferCash.decoder; }),
    argumentEncode: function (__typed__) { return exports.TransferCash.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CashHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CashHolding).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.CashHolding; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.CashHolding);



exports.RequestSpec = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({requestType: damlTypes.Text.decoder, amount: damlTypes.Optional(damlTypes.Numeric(10)).decoder, assetId: damlTypes.Optional(damlTypes.Text).decoder, }); }),
  encode: function (__typed__) {
  return {
    requestType: damlTypes.Text.encode(__typed__.requestType),
    amount: damlTypes.Optional(damlTypes.Numeric(10)).encode(__typed__.amount),
    assetId: damlTypes.Optional(damlTypes.Text).encode(__typed__.assetId),
  };
}
,
};



exports.EscrowedPrivateEquity = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({assetId: damlTypes.Text.decoder, companyName: damlTypes.Text.decoder, industry: damlTypes.Text.decoder, ownershipPercentage: damlTypes.Numeric(10).decoder, valuation: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    assetId: damlTypes.Text.encode(__typed__.assetId),
    companyName: damlTypes.Text.encode(__typed__.companyName),
    industry: damlTypes.Text.encode(__typed__.industry),
    ownershipPercentage: damlTypes.Numeric(10).encode(__typed__.ownershipPercentage),
    valuation: damlTypes.Numeric(10).encode(__typed__.valuation),
  };
}
,
};



exports.EscrowedRealEstate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({assetId: damlTypes.Text.decoder, name: damlTypes.Text.decoder, location: damlTypes.Text.decoder, propertyType: damlTypes.Text.decoder, squareFeet: damlTypes.Int.decoder, value: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    assetId: damlTypes.Text.encode(__typed__.assetId),
    name: damlTypes.Text.encode(__typed__.name),
    location: damlTypes.Text.encode(__typed__.location),
    propertyType: damlTypes.Text.encode(__typed__.propertyType),
    squareFeet: damlTypes.Int.encode(__typed__.squareFeet),
    value: damlTypes.Numeric(10).encode(__typed__.value),
  };
}
,
};



exports.EscrowedCash = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({amount: damlTypes.Numeric(10).decoder, currency: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    currency: damlTypes.Text.encode(__typed__.currency),
  };
}
,
};

