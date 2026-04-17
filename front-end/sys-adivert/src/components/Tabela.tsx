type TabelaProps = {
    data: string;
    matricula: string;
    nome: string;
    tipo: string;
    motivo: string;
    id: number;
    selectedId: number | null;
    setSelectedId: (id: number | null) => void;
}

function Tabela({ data, matricula, nome, tipo, motivo, id, selectedId, setSelectedId }: TabelaProps) {

    const dataFormatada = (data: string) => {
        return new Date(data).toLocaleDateString('pt-BR')
    }

    const truncarNome = (nome: string) => {
        const partes = nome.trim().split(/\s+/);
        return partes.slice(0, 3).join(' ');
    }

    const isSelected = selectedId === id

    const handleClick = () => {
        setSelectedId(isSelected ? null : id)
    }

    return (
        <tbody>
            <tr
                className={`tabela-row ${isSelected ? 'tabela-row--selected' : ''}`}
                onClick={handleClick}
                title="Clique para selecionar"
            >
                <td className='adivert-dado data-dado'>{dataFormatada(data)}</td>
                <td className='adivert-dado'>{matricula}</td>
                <td className='adivert-dado nome-dado'>{truncarNome(nome)}</td>
                <td className='adivert-dado tipo-dado'>{tipo}</td>
                <td className='adivert-dado motivo-dado' title={motivo}>
                    {motivo}
                </td>
            </tr>
        </tbody>
    )
}

export default Tabela
