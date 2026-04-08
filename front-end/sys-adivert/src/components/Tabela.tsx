import Excluir from "./Excluir";

type TabelaProps = {
    data: string;
    matricula: string;
    nome: string;
    tipo: string;
    motivo: string;
    id: number;
    excluirView: boolean;
    setExcluirView: React.Dispatch<React.SetStateAction<boolean>>;
    setAdiverts: React.Dispatch<React.SetStateAction<any[]>>;
    getAdiverts: () => void;
}

function Tabela( { data, matricula, nome, tipo, motivo, id , excluirView, setExcluirView, setAdiverts, getAdiverts } : TabelaProps ) {

    const dataFormatada = (data: string) => {
        return new Date(data).toLocaleDateString('pt-BR')
    }

    return (
        <>
            {excluirView && (
                <div className='overlay'>
                    <div className='caixa'>
                        <Excluir
                        setAdiverts={setAdiverts}
                        getAdiverts={getAdiverts}
                        setExcluirView={setExcluirView}
                        id={id}
                        />
                    </div>
                </div>  
            )}
            <tr>
                <td className='adivert-dado data-dado'>{dataFormatada(data)}</td>
                <td className='adivert-dado'>{matricula}</td>
                <td className='adivert-dado'>{nome.length > 20 ? (nome.substring(0, 20) + '...') : nome}</td>
                <td className='adivert-dado'>{tipo}</td>
                <td className='adivert-dado'>{motivo.length > 33 ? (motivo.substring(0, 33) + '...') : motivo}</td>
                <td className='adivert-dado box-actions-buttons'>
                    <button className='actions-buttons' onClick={() => {setExcluirView(true)}}><img className='icon' src="lixeira.png" alt="icone-lixeira"/></button>
                    <button className='actions-buttons'><img className='icon' src="edit.png" alt="icone-edit " /></button>
                    <button className='actions-buttons'><img className='icon' src="download-file.png" alt="icone-download-arquivo"/></button>
                </td>
            </tr>
        </>
    )
}



export default Tabela