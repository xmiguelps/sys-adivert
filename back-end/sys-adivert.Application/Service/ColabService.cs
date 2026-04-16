using sys_adivert.colab.Entity;
using sys_adivert.Application.Colabs.Dtos;
using sys_adivert.Application.Repository;

namespace sys_adivert.Application.Service;

public class ColabService : IColabService
{
    private readonly IColabRepository _repository;

    public ColabService(IColabRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ColabReadDto>> GetAllAsync()
    {
        var colabs = await _repository.GetAllAsync();
        return colabs.Select(c => new ColabReadDto(c.Id, c.Nome, c.Matricula));
    }

    public async Task<string?> GetMatriculaByNomeAsync(string nome)
    {
        if (string.IsNullOrWhiteSpace(nome)) return null;

        return await _repository.GetMatriculaByNomeAsync(nome);
    }

    public async Task<bool> CreateAsync(ColabCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nome) || string.IsNullOrWhiteSpace(dto.Matricula))
            return false;

        var colab = new Colab(dto.Nome, dto.Matricula);
        await _repository.CreateAsync(colab);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var colab = await _repository.GetByIdAsync(id);
        if (colab is null) return false;

        await _repository.DeleteAsync(colab);
        return true;
    }
}
