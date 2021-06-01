import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const UserLogin = ({ url, title }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { doRequest, errors } = useRequest({
    url: url,
    method: 'post',
    body: {
      email,
      password,
    },
    onSuccess: () => Router.push('/'),
  });

  const submitHandler = async (event) => {
    event.preventDefault();
    doRequest();
  };

  return (
    <form onSubmit={submitHandler}>
      <h1>{title}</h1>
      <div className="form-group">
        <label>Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control"
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="form-control"
        />
      </div>
      {errors}
      <button className="btn btn-primary">{title}</button>
    </form>
  );
};

export default UserLogin;
