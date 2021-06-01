import { useEffect, useState } from 'react';
import Router from 'next/router';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ currentUser, order }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id,
    },
    onSuccess: (payment) => Router.push('/orders'),
  });

  if (timeLeft < 0) {
    return <div>Order Expired</div>;
  }

  return (
    <div>
      <h1>Purchasing {order.ticket.title}</h1>
      <h4>
        Time left: <strong>{timeLeft}</strong> seconds
      </h4>
      {errors}
      <div>
        <StripeCheckout
          token={({ id }) => doRequest({ token: id })}
          amount={order.ticket.price * 100}
          email={currentUser.email}
          stripeKey="pk_test_51IwhRNJqiR6VKiFNn36z9yZBSyTUWSFF0OUcOCHaw3LO4DyBvCh0EHfc4YxzVg1QMcm136e8ZsMha4QI7FEAfSp400wCdK0oVE"
        />
      </div>
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);
  return { order: data };
};

export default OrderShow;
