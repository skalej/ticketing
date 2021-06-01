import axios from 'axios';
import Link from 'next/link';

const LandingPage = ({ currentUser, tickets }) => {
  const ticketList = tickets.map((ticket) => {
    // const href = `/tickets/${ticket.id}`;
    return (
      <tr key={ticket.id}>
        <td>
          {ticket.title}
          {/* <Link href={href}>
            <a style={{ textDecoration: 'none' }}>{ticket.title}</a>
          </Link> */}
        </td>
        <td>{ticket.price}</td>
        <td>
          <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
            <a>View</a>
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div>
      <h1>Tickets</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>{ticketList}</tbody>
      </table>
    </div>
  );
};

LandingPage.getInitialProps = async (context, client, currentUser) => {
  const { data } = await client.get('/api/tickets');
  return { tickets: data };
};

/**
 * Just to compare the old version with the new one using buildClient helper function
 */
LandingPage.getInitialPropsOld = async ({ req }) => {
  //--- we cannot use useRequest hook here. Hooks are used inside of React components
  //      getInitialProps is not a component, it is a plain function.
  if (typeof window === 'undefined') {
    //--- we are on the server
    //    requests should be made to http://ingress-nginx.ingress-nginx.svc.cluster.local
    const { data } = await axios.get(
      //--- 'http://SERVICENAME.NAMESPACE.svc.cluster.local'
      'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser',
      {
        /**
         * To solve cookie issue, we can take all the headers on the incoming request
         * and pass it through to the request that we’re sending off to Ingress Nginx.
         * This will essentially cause this request right there to act as a proxy of sorts.
         */
        headers: req.headers,
        // headers: {
        //   Host: 'ticketing.dev',
        // },
      }
    );
    return data;
  } else {
    //--- we are on the browser
    //    requets can be made with a base URL of ''
    const { data } = await axios.get('/api/users/currentuser');
    return data;
  }
};

export default LandingPage;
