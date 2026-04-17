import { useState } from "react";
import Excluir from "./Excluir";
import Update from "./Update";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    const [updateView, setUpdateView]   = useState<boolean>(false)
    const [inspecionarView, setInspecionarView] = useState<boolean>(false)

    const dataFormatada = (data: string) => {
        return new Date(data).toLocaleDateString('pt-BR')
    }

    const truncarNome = (nome: string) => {
        const partes = nome.trim().split(/\s+/);
        return partes.slice(0, 3).join(' ');
    }

    const downloadPDF = () => {
        const doc = new jsPDF()
        doc.text('Sistema de Advertências', 14, 16)
        autoTable(doc, {
            startY: 25,
            head: [['Data', 'Matrícula', 'Nome', 'Tipo', 'Motivo']],
            body: [[
                new Date(data).toLocaleDateString('pt-BR'),
                matricula,
                nome,
                tipo,
                motivo
            ]],
        })
        doc.save('advertencias.pdf')
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

            {/* ── Modal: Inspecionar ── */}
            {inspecionarView && (
                <div className="overlay" onClick={() => setInspecionarView(false)}>
                    <div className="caixa inspecionar-caixa" onClick={e => e.stopPropagation()}>
                        <div className="inspecionar-header">
                            <h2 className="inspecionar-titulo">🔍 Detalhes da Advertência</h2>
                            <button
                                className="add-btn-fechar"
                                onClick={() => setInspecionarView(false)}
                                title="Fechar"
                            >
                                <img className="icon" src="close.png" alt="fechar" />
                            </button>
                        </div>

                        <div className="inspecionar-body">
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">📅 Data</span>
                                <span className="inspecionar-valor">{dataFormatada(data)}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">👤 Nome do Colaborador</span>
                                <span className="inspecionar-valor">{nome}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">🪪 Matrícula</span>
                                <span className="inspecionar-valor">{matricula}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">📝 Tipo</span>
                                <span className={`inspecionar-badge ${tipo === 'Escrita' ? 'badge-escrita' : 'badge-verbal'}`}>
                                    {tipo}
                                </span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">⚠️ Motivo</span>
                                <span className="inspecionar-motivo">{motivo}</span>
                            </div>
                        </div>

                        <div className="inspecionar-rodape">
                            <button
                                className="btn add-btn-confirm"
                                onClick={() => { setInspecionarView(false); setUpdateView(true); }}
                                title="Editar esta advertência"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                className="btn cancel-btn"
                                onClick={() => setInspecionarView(false)}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <tbody>
                <tr>
                    <td className='adivert-dado data-dado'>{dataFormatada(data)}</td>
                    <td className='adivert-dado'>{matricula}</td>
                    <td className='adivert-dado nome-dado'>{truncarNome(nome)}</td>
                    <td className='adivert-dado tipo-dado'>{tipo}</td>
                    <td className='adivert-dado motivo-dado' title={motivo}>
                        {motivo}
                    </td>
                    <td className='adivert-dado box-actions-buttons'>
                        <button
                            className='actions-buttons btn-inspecionar'
                            onClick={() => setInspecionarView(true)}
                            title="Inspecionar advertência"
                        >
                            🔍
                        </button>
                        <button
                            className='actions-buttons'
                            onClick={() => setExcluirView(true)}
                            title="Excluir"
                        >
                            <img className='icon' src="lixeira.png" alt="icone-lixeira"/>
                        </button>
                        <button
                            className='actions-buttons'
                            onClick={() => setUpdateView(true)}
                            title="Editar"
                        >
                            <img className='icon' src="edit.png" alt="icone-edit" />
                        </button>
                        <button
                            className='actions-buttons'
                            onClick={downloadPDF}
                            title="Baixar PDF desta advertência"
                        >
                            <img className='icon' src="download-file.png" alt="icone-download-arquivo"/>
                        </button>
                    </td>
                </tr>
            </tbody>
        </>
    )
}

export default Tabela
