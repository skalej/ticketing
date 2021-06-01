import mongoose from 'mongoose';
import { Order, OrderStatus } from './order';

interface TicketAttrs {
  //--- these are just attributes that the Order service needs to work correctly
  id: string;
  title: string;
  price: number;
}

export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number;
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema<TicketDoc, TicketModel>(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      //--- the price should be positive
      min: 0,
    },
  },
  {
    // optimisticConcurrency: true,
    // versionKey: 'version',
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

//--- to use 'version' instead of '__v'
ticketSchema.set('versionKey', 'version');
//--- use this plugin to implement optimistic concurrency control
//ticketSchema.plugin(updateIfCurrentPlugin);

ticketSchema.pre('save', function (done) {
  /**
   * Model.prototype.$where
   * Additional properties to attach to the query when calling 'save()' and 'isNew' is false
   */
  this.$where = {
    version: this.get('version') - 1,
  };

  //--- this is a callback function that we have to manually invoke once we've done
  //    everything we intend to do inside of this middleware
  done();
});

//--- to add a method to the Model (collection)
ticketSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Ticket.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  // return new Ticket(attrs);
  //--- to handle the ID adjustment
  return new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
  });
};

//--- to add a method to the Document
ticketSchema.methods.isReserved = async function () {
  //--- in order to get information about the ticket document that we're operating
  //    on, we're going to access 'this'
  //    'this' === the ticket document that we just called 'isReserved' on
  //    the reason we have the 'function' keyword here is becase if we use
  //    an arrow function, it's going to mess around with the value of 'this' inside
  //    of the function.
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder; // use '!' operator twice
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
