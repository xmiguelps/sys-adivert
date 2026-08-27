using System.Security.Cryptography;
using sys_adivert.adivert.Entity;
using sys_adivert.Application.Adiverts.Dtos;

namespace sys_adivert.Application.Service;

public interface IAdivertService
{
    Task<IEnumerable<AdivertReadDto>>  GetAllAsync(string? nome, CancellationToken cancellationToken = default);

    Task<AdivertDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> CreateAsync(AdivertCreateDto dto, CancellationToken cancellationToken = default);

    Task<AdivertBatchResultDto> CreateBatchAsync(
        IReadOnlyList<AdivertCreateDto>? dtos,
        CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(int id, AdivertUpdateDto dto, CancellationToken cancellationToken = default);

    Task<bool> SetAssinaturaAsync(int id, bool assinada, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
