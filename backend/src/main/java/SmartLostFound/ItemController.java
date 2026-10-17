
package SmartLostFound;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemRepository itemRepository;

    public ItemController(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @GetMapping
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @GetMapping("/{id}")
    public Item getItemById(@PathVariable Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Item not found: " + id));
    }

    @PostMapping
    public Item addItem(@RequestBody Item item) {
        item.setContact(item.getContactNumber());
        return itemRepository.save(item);
    }

    @PutMapping("/{id}")
    public Item updateItem(@PathVariable Long id,
                           @RequestBody Item updatedItem) {

        Item item = itemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Item not found: " + id));

        item.setItemName(updatedItem.getItemName());
        item.setCategory(updatedItem.getCategory());
        item.setLocation(updatedItem.getLocation());
        item.setStatus(updatedItem.getStatus());
        item.setItemDate(updatedItem.getItemDate());
        item.setDescription(updatedItem.getDescription());
        item.setStudentName(updatedItem.getStudentName());
        item.setPrn(updatedItem.getPrn());
        item.setDepartment(updatedItem.getDepartment());
        item.setContactNumber(updatedItem.getContactNumber());
        item.setEmail(updatedItem.getEmail());
        item.setPhoto(updatedItem.getPhoto());
        item.setCreatedAt(updatedItem.getCreatedAt());
        item.setContact(updatedItem.getContactNumber());

        return itemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    public void deleteItem(@PathVariable Long id) {
        itemRepository.deleteById(id);
    }
}
