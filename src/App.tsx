import './App.css'
import HeadBar from './components/HeadBar'
import NavBar from './components/NavBar'
import BSTComponent from './components/BstTree'
import LinkedList from './components/LinkedList'
import SkipListVisualizer from './components/SkipList';
import HashTableComponent from './components/HashTable'
import LinkedListComponent from './components/LinkedList'

function App() {

  return (
    <>
      <HeadBar />
    <BSTComponent />
   <LinkedListComponent />
    <SkipListVisualizer />
    <HashTableComponent />
   
   
    </>
  )
}

export default App
