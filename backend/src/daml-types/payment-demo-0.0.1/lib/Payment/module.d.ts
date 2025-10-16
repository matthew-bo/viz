// Generated from Payment.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as damlLedger from '@daml/ledger';

import * as pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662 from '@daml.js/d14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662';

export declare type Payment = {
  sender: damlTypes.Party;
  receiver: damlTypes.Party;
  amount: damlTypes.Numeric;
  currency: string;
  description: string;
  submittedAt: damlTypes.Time;
  committedAt: damlTypes.Time;
};

export declare interface PaymentInterface {
  Archive: damlTypes.Choice<Payment, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<Payment, undefined>>;
}
export declare const Payment:
  damlTypes.Template<Payment, undefined, 'fbc4ef35efbb9346932f8cbbeaebfb31062ae9c58252e12585b4886ea0039d76:Payment:Payment'> &
  damlTypes.ToInterface<Payment, never> &
  PaymentInterface;

export declare namespace Payment {
  export type CreateEvent = damlLedger.CreateEvent<Payment, undefined, typeof Payment.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<Payment, typeof Payment.templateId>
  export type Event = damlLedger.Event<Payment, undefined, typeof Payment.templateId>
  export type QueryResult = damlLedger.QueryResult<Payment, undefined, typeof Payment.templateId>
}



export declare type Reject = {
};

export declare const Reject:
  damlTypes.Serializable<Reject> & {
  }
;


export declare type Accept = {
};

export declare const Accept:
  damlTypes.Serializable<Accept> & {
  }
;


export declare type PaymentRequest = {
  sender: damlTypes.Party;
  receiver: damlTypes.Party;
  amount: damlTypes.Numeric;
  currency: string;
  description: string;
  submittedAt: damlTypes.Time;
};

export declare interface PaymentRequestInterface {
  Archive: damlTypes.Choice<PaymentRequest, pkgd14e08374fc7197d6a0de468c968ae8ba3aadbf9315476fd39071831f5923662.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PaymentRequest, undefined>>;
  Reject: damlTypes.Choice<PaymentRequest, Reject, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PaymentRequest, undefined>>;
  Accept: damlTypes.Choice<PaymentRequest, Accept, damlTypes.ContractId<Payment>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PaymentRequest, undefined>>;
}
export declare const PaymentRequest:
  damlTypes.Template<PaymentRequest, undefined, 'fbc4ef35efbb9346932f8cbbeaebfb31062ae9c58252e12585b4886ea0039d76:Payment:PaymentRequest'> &
  damlTypes.ToInterface<PaymentRequest, never> &
  PaymentRequestInterface;

export declare namespace PaymentRequest {
  export type CreateEvent = damlLedger.CreateEvent<PaymentRequest, undefined, typeof PaymentRequest.templateId>
  export type ArchiveEvent = damlLedger.ArchiveEvent<PaymentRequest, typeof PaymentRequest.templateId>
  export type Event = damlLedger.Event<PaymentRequest, undefined, typeof PaymentRequest.templateId>
  export type QueryResult = damlLedger.QueryResult<PaymentRequest, undefined, typeof PaymentRequest.templateId>
}


