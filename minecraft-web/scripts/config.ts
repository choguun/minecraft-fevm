import { http, createConfig } from '@wagmi/core'
import { filecoinCalibration } from '@wagmi/core/chains'
import { injected } from '@wagmi/connectors'

export const config = createConfig({
  chains: [filecoinCalibration],
  connectors: [injected()],
  transports: {
    [filecoinCalibration.id]: http()
  },
})