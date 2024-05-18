import { useActiveNetworkVersion } from 'state/application/hooks'
import { healthClient } from './../../apollo/client'
import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { ArbitrumNetworkInfo, EthereumNetworkInfo } from 'constants/networks'

export const SUBGRAPH_HEALTH = gql`
  query health($name: Bytes) {
    indexingStatusForCurrentVersion(subgraphName: $name, subgraphError: allow) {
      synced
      health
      chains {
        chainHeadBlock {
          number
        }
        latestBlock {
          number
        }
      }
    }
  }
`

export const SUBGRAPH_BLOCK = gql`
  query MyQuery {
    _meta {
      block {
        number
      }
    }
  }
`

interface BlockResponse {
  _meta: {
    block: {
      number: number
    }
  }
}

/**
 * Fetch top addresses by volume
 */
export function useFetchedSubgraphStatus(): {
  available: boolean | null
  syncedBlock: number | undefined
  headBlock: number | undefined
} {
  const [activeNetwork] = useActiveNetworkVersion()

  const { loading, error, data } = useQuery<BlockResponse>(SUBGRAPH_BLOCK, {
    client: healthClient,
    fetchPolicy: 'network-only',
    variables: {
      name:
        activeNetwork === EthereumNetworkInfo
          ? 'uniswap/uniswap-v3'
          : activeNetwork === ArbitrumNetworkInfo
          ? 'ianlapham/uniswap-arbitrum-one'
          : 'ianlapham/uniswap-optimism',
    },
  })

  const parsed = data?._meta

  if (loading) {
    return {
      available: null,
      syncedBlock: undefined,
      headBlock: undefined,
    }
  }

  if ((!loading && !parsed) || error) {
    return {
      available: false,
      syncedBlock: undefined,
      headBlock: undefined,
    }
  }

  const syncedBlock = parsed?.block.number
  const headBlock = parsed?.block.number

  return {
    available: true,
    syncedBlock: syncedBlock ? syncedBlock : undefined,
    headBlock: headBlock ? headBlock : undefined,
  }
}
