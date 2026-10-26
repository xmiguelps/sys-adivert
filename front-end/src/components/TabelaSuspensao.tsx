import type { MouseEvent } from "react";
import { CheckCircle, Square } from "@phosphor-icons/react";
import { formatarDataBr } from "../utils/datas";

type TabelaSuspensaoProps = {
    dataEmissao: string;
    matricula: string;
    nome: string;
    dias: number;
    dataInicio: string;
    dataRetorno: string;
    motivo: string;
    assinada: boolean;
    id: number;
    selected: boolean;
    onRowSelect: (id: number, ctrl: boolean) => void;
    onToggleAssinatura: (id: number, assinada: boolean) => void;
}

function TabelaSuspensao({
    dataEmissao, matricula, nome, dias, dataInicio, dataRetorno, motivo, assinada, id,
    selected, onRowSelect, onToggleAssinatura,
}: TabelaSuspensaoProps) {

    const truncarNome = (nome: string) => nome.trim().split(/\s+/).slice(0, 3).join(' ');

    const handleClick = (e: MouseEvent) => {
        onRowSelect(id, e.ctrlKey || e.metaKey)
    }

    return (
        <tbody>
            <tr
                className={`tabela-row ${selected ? 'tabela-row--selected' : ''}`}
                onClick={handleClick}
                title="Clique para selecionar (segure Ctrl para selecionar várias)"
            >
                <td className='adivert-dado data-dado'>{formatarDataBr(dataEmissao)}</td>
                <td className='adivert-dado'>{matricula}</td>
                <td className='adivert-dado nome-dado'>{truncarNome(nome)}</td>
                <td className='adivert-dado dias-dado'>{dias}</td>
                <td className='adivert-dado data-dado'>{formatarDataBr(dataInicio)}</td>
                <td className='adivert-dado data-dado'>{formatarDataBr(dataRetorno)}</td>
                <td className='adivert-dado motivo-dado' title={motivo}>
                    {motivo}
                </td>
                <td
                    className='adivert-dado assinada-dado'
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        type='button'
                        className={`assinada-toggle ${assinada ? 'assinada-toggle--sim' : 'assinada-toggle--nao'}`}
                        onClick={() => onToggleAssinatura(id, !assinada)}
                        aria-pressed={assinada}
                        title={assinada ? 'Assinada. Clique para desmarcar.' : 'Pendente. Clique para marcar como assinada.'}
                    >
                        {assinada
                            ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                            : <><Square size={14} /> Pendente</>}
                    </button>
                </td>
            </tr>
        </tbody>
    )
}

export default TabelaSuspensao
