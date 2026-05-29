using sys_adivert.motivo.Entity;
using sys_adivert.Application.Motivos.Dtos;
using sys_adivert.Application.Repository;

namespace sys_adivert.Application.Service;

public class MotivoService : IMotivoService
{
    private readonly IMotivoRepository _repository;

    public MotivoService(IMotivoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<MotivoReadDto>> GetAllAsync()
    {
        var motivos = await _repository.GetAllAsync();
        return motivos.Select(m => new MotivoReadDto(m.Id, m.Descricao));
    }

    public async Task<bool> CreateAsync(MotivoCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Descricao)) return false;

        // Bloqueia duplicados (case-insensitive)
        if (await _repository.ExistsByDescricaoAsync(dto.Descricao)) return false;

        var motivo = new Motivo(dto.Descricao.Trim());
        await _repository.CreateAsync(motivo);

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var motivo = await _repository.GetByIdAsync(id);
        if (motivo is null) return false;

        await _repository.DeleteAsync(motivo);
        return true;
    }
}
