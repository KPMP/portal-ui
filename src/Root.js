/* @flow */
/* eslint better/no-ifs:0, import/no-commonjs:0, fp/no-class:0 */

import React from 'react';
import Relay from 'react-relay/classic';
import { parse } from 'query-string';
import md5 from 'blueimp-md5';
import urlJoin from 'url-join';
import { RelayNetworkLayer, urlMiddleware } from 'react-relay-network-layer';
import retryMiddleware from '@ncigdc/utils/retryMiddleware';

import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import { viewerQuery } from '@ncigdc/routes/queries';
import Login from '@ncigdc/routes/Login';
import Container from './Portal';
import { API, IS_AUTH_PORTAL } from '@ncigdc/utils/constants';
import { clear } from '@ncigdc/utils/cookies';
import { Provider, connect } from 'react-redux';
import setupStore from '@ncigdc/dux';
import { fetchApiVersionInfo } from '@ncigdc/dux/versionInfo';
import { fetchUser, forceLogout, setUserAccess } from '@ncigdc/dux/auth';

Relay.injectNetworkLayer(
  new RelayNetworkLayer([
    urlMiddleware({
      url: req => urlJoin(API, 'graphql'),
    }),
    retryMiddleware({
      fetchTimeout: 15000,
      retryDelays: attempt => Math.pow(2, attempt + 4) * 100, // or simple array [3200, 6400, 12800, 25600, 51200, 102400, 204800, 409600],
      forceRetry: (cb, delay) => {
        window.forceRelayRetry = cb;
        console.log(
          `call \`forceRelayRetry()\` for immediately retry! Or wait ${delay} ms.`,
        );
      },
      statusCodes: [500, 503, 504],
    }),
    // Add hash id to request
    next => req => {
      const [url, search = ''] = req.url.split('?');
      const hash =
        parse(search).hash ||
        md5(
          [
            req.relayReqObj._printedQuery.text,
            JSON.stringify(req.relayReqObj._printedQuery.variables),
          ].join(':'),
        );

      req.url = `${url}?hash=${hash}`;

      if (!IS_AUTH_PORTAL) {
        return next(req);
      } else {
        req.credentials = 'include';
        let { user } = window.store.getState().auth;
        let parsedBody = JSON.parse(req.body);
        req.body = JSON.stringify(parsedBody);

        return next(req)
          .then(res => {
            let { json } = res;
            // intersection and fence_projects coming as nested arrays, all 3 will be changed to boolean values
            store.dispatch(
              setUserAccess({
                intersection: json.intersection[0],
                nih_projects: json.nih_projects,
                fence_projects: json.fence_projects[0],
              }),
            );

            return res;
          })
          .catch(err => {
            if (err.fetchResponse && err.fetchResponse.status === 403) {
              if (user) {
                store.dispatch(forceLogout());
              }
            }
          });
      }
    },
  ]),
);

export const store = setupStore({
  persistConfig: {
    keyPrefix: 'ncigdcActive',
  },
});

window.store = store;

store.dispatch(fetchApiVersionInfo());

if (process.env.NODE_ENV !== 'development') {
  store.dispatch(fetchUser());
}

class RelayRoute extends Relay.Route {
  static routeName = 'RootRoute';
  static queries = viewerQuery;
}

let HasUser = connect(state => state.auth)(props => {
  return props.children({
    user: props.user,
    failed: props.failed,
    error: props.error,
    intersection: props.intersection,
    fence_projects: props.fence_projects,
    nih_projects: props.nih_projects,
  });
});

const Root = (props: mixed) => (
  <Router>
    <Provider store={store}>
      <React.Fragment>
        {IS_AUTH_PORTAL && <Route exact path="/login" component={Login} />}
        <Route
          render={props => {
            return IS_AUTH_PORTAL &&
              !window.location.pathname.includes('/login') ? (
              <HasUser>
                {({
                  user,
                  failed,
                  error,
                  intersection,
                  nih_projects,
                  fence_projects,
                }) => {
                  console.log('has user render: ', intersection, user);
                  if (
                    failed &&
                    error.message === 'Session timed out or not authorized'
                  ) {
                    return (window.location.href = '/login?error=timeout');
                  }
                  if (failed) {
                    return <Redirect to="/login" />;
                  }
                  if (user && intersection && !intersection.length) {
                    return <Redirect to="/login?error=no_intersection" />;
                  }

                  if (user) {
                    if (intersection && !intersection.length) {
                      return <Redirect to="/login?error=no_intersection" />;
                    }
                    if (fence_projects && !fence_projects.length) {
                      return <Redirect to="/login?error=no_fence_projects" />;
                    }
                    if (nih_projects && !nih_projects.length) {
                      return <Redirect to="/login?error=no_nih_projects" />;
                    }
                    return (
                      <Relay.Renderer
                        Container={Container}
                        queryConfig={new RelayRoute(props)}
                        environment={Relay.Store}
                      />
                    );
                  }

                  return null;
                }}
              </HasUser>
            ) : (
              <Relay.Renderer
                Container={Container}
                queryConfig={new RelayRoute(props)}
                environment={Relay.Store}
              />
            );
          }}
        />
      </React.Fragment>
    </Provider>
  </Router>
);

export default Root;
