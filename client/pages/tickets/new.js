import Router from 'next/router';
import { useState } from 'react';
import useRequest from '../../hooks/use-request';

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');

  const { doRequest, errors } = useRequest({
    url: '/api/tickets',
    method: 'post',
    body: {
      title,
      price,
    },
    onSuccess: (data) => {
      Router.push('/');
    },
  });

  const submitHandler = (event) => {
    event.preventDefault();
    doRequest();
  };

  const onBlurHandler = () => {
    const value = parseFloat(price);
    if (isNaN(value)) {
      return;
    }
    setPrice(value.toFixed(2)); // round the price with 2 decimal numbers
  };

  return (
    <div>
      <h1>Create a Ticket</h1>
      <form onSubmit={submitHandler}>
        <div className="form-group">
          <label>Title</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input
            className="form-control"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={onBlurHandler}
          />
        </div>
        {errors}
        <button className="btn btn-primary"> Submit</button>
      </form>
    </div>
  );
};

export default NewTicket;
