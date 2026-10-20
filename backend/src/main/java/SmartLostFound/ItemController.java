package SmartLostFound;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private static final Logger log = LoggerFactory.getLogger(ItemController.class);

    private final ItemRepository itemRepository;
    private final EmailAlertService emailAlertService;

    public ItemController(ItemRepository itemRepository,
                          EmailAlertService emailAlertService) {
        this.itemRepository = itemRepository;
        this.emailAlertService = emailAlertService;
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
        Item saved = itemRepository.save(item);

        // Alert only for LOST reports. A failure here never blocks saving.
        if ("Lost".equalsIgnoreCase(saved.getStatus())) {
            try {
                emailAlertService.sendLostAlert(
                        Objects.toString(saved.getItemName(), ""),
                        Objects.toString(saved.getCategory(), ""),
                        Objects.toString(saved.getLocation(), ""),
                        Objects.toString(saved.getItemDate(), ""),
                        Objects.toString(saved.getDescription(), ""),
                        Objects.toString(saved.getStudentName(), ""),
                        Objects.toString(saved.getEmail(), ""));
            } catch (Exception e) {
                log.error("Lost-item alert could not be started", e);
            }
        }

        return saved;
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