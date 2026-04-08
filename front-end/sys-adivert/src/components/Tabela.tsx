import { useState } from "react";
import Excluir from "./Excluir";
import Update from "./Update";

type TabelaProps = {
    data: string;
    matricula: string;
    nome: string;
    tipo: string;
    motivo: string;
    id: number;
    getAdiverts: () => void;
}

function Tabela( { data, matricula, nome, tipo, motivo, id, getAdiverts } : TabelaProps ) {

    const [excluirView, setExcluirView] = useState<boolean>(false)
    const [updateView, setUpdateView] = useState<boolean>(false)

    const dataFormatada = (data: string) => {
        return new Date(data).toLocaleDateString('pt-BR')
    }

    return (
        <>
            {excluirView && (
                <div className='overlay'>
                    <div className='caixa'>
                        <Excluir
                        getAdiverts    = {getAdiverts}
                        setExcluirView = {setExcluirView}
                        id             = {id}
                        />
                    </div>
                </div>  
            )}
            {updateView && (
                <div className="overlay">
                    <div className="caixa">
                        <Update
                        getAdiverts    = {getAdiverts}
                        setUpdateView  = {setUpdateView}
                        id             = {id}
                        matricula      = {matricula}
                        nome           = {nome}
                        tipo           = {tipo}
                        motivo         = {motivo}
                        data           = {data}
                        />
                    </div>
                </div>
            )}
            <tbody>
                <tr>
                    <td className='adivert-dado data-dado'>{dataFormatada(data)}</td>
                    <td className='adivert-dado'>{matricula}</td>
                    <td className='adivert-dado'>{nome.length > 20 ? (nome.substring(0, 20) + '...') : nome}</td>
                    <td className='adivert-dado'>{tipo}</td>
                    <td className='adivert-dado'>{motivo.length > 33 ? (motivo.substring(0, 33) + '...') : motivo}</td>
                    <td className='adivert-dado box-actions-buttons'>
                        <button className='actions-buttons' onClick={() => {setExcluirView(true)}}><img className='icon' src="lixeira.png" alt="icone-lixeira"/></button>
                        <button className='actions-buttons' onClick={() => {setUpdateView(true)}}><img className='icon' src="edit.png" alt="icone-edit " /></button>
                        <button className='actions-buttons'><img className='icon' src="download-file.png" alt="icone-download-arquivo"/></button>
                    </td>
                </tr>
            </tbody>
        </>
    )
}



export default Tabela