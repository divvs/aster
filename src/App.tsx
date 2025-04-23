import { PGlite } from '@electric-sql/pglite'
import { useState } from 'react'
import { createStore } from 'tinybase'
import { createPglitePersister } from 'tinybase/persisters/persister-pglite'
import { Provider, useCreatePersister, useCreateStore } from 'tinybase/ui-react'
import { Inspector } from 'tinybase/ui-react-inspector'

function App() {
  const [initializing, setInitializing] = useState(true)

  const store = useCreateStore(createStore)

  useCreatePersister(store, async (store) => {
    const pglite = await PGlite.create('idb://aster')
    const persister = await createPglitePersister(store, pglite)

    await persister.startAutoLoad()
    await persister.startAutoSave()

    setInitializing(false)
    return persister
  })

  return (
    <Provider store={store}>
      {initializing ? <div>Loading...</div> : <div>clean</div>}
      <Inspector />
    </Provider>
  )
}

export default App
