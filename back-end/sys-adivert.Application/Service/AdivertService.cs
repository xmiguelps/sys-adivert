using sys_adivert.adivert.Entity;
using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Repository;

namespace sys_adivert.Application.Service;

public class AdivertService : IAdivertService
{
    public readonly IAdivertRepository _repository;

    public AdivertService(IAdivertRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<AdivertReadDto>> GetAllAsync (string? nome)
    {
        var Adiverts = await _repository.GetAllAsync();
        if (!string.IsNullOrWhiteSpace(nome))
        {
            Adiverts = await _repository.GetByColabAsync(nome);
        }

        return Adiverts.Select(u => new AdivertReadDto(u.Data, u.Matricula, u.Nome, u.Tipo, u.Motivo));
    }

    public async Task<bool> CreateAsync(AdivertCreateDto dto) {
        if (dto.Matricula == null || dto.Motivo == null || dto.Nome == null || dto.Tipo == null) return false;

        var adivert = new Adivert(dto.Data, dto.Matricula, dto.Motivo, dto.Nome, dto.Tipo);
        await _repository.CreateAsync(adivert);

        return true;
    }

    public async Task<bool> UpdateAsync(int id, AdivertUpdateDto dto) {
        var adivert = await _repository.GetByIdAsync(id);
        if (adivert is null) return false;

        adivert.Update(dto.Data, dto.Matricula, dto.Nome, dto.Tipo, dto.Motivo);
        await _repository.UpdateAsync(adivert);

        return true;
    }

    public async Task<bool> DeleteAsync(int id) {
        var adivert = await _repository.GetByIdAsync(id);
        if (adivert is null) return false;

        await _repository.DeleteAsync(adivert);
        return true;
    }
}
