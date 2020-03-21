import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import { Container,Transition } from 'semantic-ui-react';
import ResultCard from '../components/ResultCard';

function Search(props) {
  const input = props.match.params.input;

  const {
    loading,
    data: {getSearchResult : results}
  } = useQuery(FETCH_SERACH_QUERY, {
    variables: {
      input
    }
  });

  return (
    <Container style={{ marginTop: '7em' }}>
       {loading ? (
          <h1>Loading results..</h1>
        ) : (
          <Transition.Group>
            {results &&
              results.map((result, index) => (
                <dl key={index}> <ResultCard result={result} /> </dl>
              ))}
          </Transition.Group>
        )}
    </Container>
  );
}

const FETCH_SERACH_QUERY = gql`
  query($input: String!) {
    getSearchResult(query: $input) {
      category
      name
      score
      numRate
      _id
    }
  }
`;

export default Search;
