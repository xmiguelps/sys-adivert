import Tabela from './components/Tabela'

function App() {

  return (
    <>
      <div className='d-flex box-site'>
        <div className='d-flex box-body flex-column'>
          <div className='d-flex'>
            <img className='logo' src="/logo.png" alt="logo-empresa" />
            <h1>Sistema de Adivertencias</h1>
          </div>
          <div className='box-search'>
            <input type="text" className='search-input' name="search" id="search"/> <button className='search-buttom'><img className='icon' src="/search.png" alt="botão de pesquisa"/></button>
          </div>
          <div className='d-flex'>
            <div className='d-flex box-main'>
              <div className='box-adiverts'>
                <Tabela/>
              </div>
            </div>
            <div className='d-flex box-menu flex-column'>
              <button><img className='icon' src="/plus.png" alt="" /></button>
              <button><img className='icon' src="/download.png" alt="" /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

}
export default App