using System.Security.Cryptography;
using sys_adivert.adivert.Entity;
using sys_adivert.Application.Adiverts.Dtos;

namespace sys_adivert.Application.Service;

public interface IAdivertService
{
    Task<IEnumerable<AdivertReadDto>>  GetAllAsync(string? nome);

    Task<bool> CreateAsync(AdivertCreateDto dto);

    Task<bool> UpdateAsync(int id, AdivertUpdateDto dto);

    Task<bool> DeleteAsync(int id);
}