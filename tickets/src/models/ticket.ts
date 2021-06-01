import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

//--- An interface that describes the properties that are required to create a new Ticket
interface TicketAttrs {
  title: string;
  price: number;
  userId: string;
}

//--- An interface that descibes the properties that a Ticket Document has
interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  userId: string;
  //--- if it was '__v', it's included in the base mongoose.Document class
  //--- but 'version' is not included, so adding it here to tell Typescript about it
  version: number;
  //--- mark this as optional because when we first create a ticket, there will not be an orderId associated with it
  orderId?: string;
}

//--- An interface that describes the properties that a Ticket model has
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
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
    },
    userId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
    },
  },
  {
    optimisticConcurrency: true,
    versionKey: 'version',
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

//--- to use 'version' instead of '__v'
// ticketSchema.set('versionKey', 'version');
//--- use this plugin to implement optimistic concurrency control
// ticketSchema.plugin(updateIfCurrentPlugin);

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket(attrs);
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

//-----------------------------------------------
// const ticket = Ticket.build({
//   title: 'sdjfklsdj',
//   price: 10
// });

//-----------------------------------------------
// const buildTicket = (attrs: TicketAttrs) => {
//   return new Ticket(attrs);
// };

// const ticket = buildTicket({
//   title: '',
//   price: 20,
// });

//-----------------------------------------------
// const ticket = new Ticket({
//   tit: '',
//   price: 'sldfjlsdjf',
//   sldjfsdl: 234234
// });

export { Ticket };
